import React, { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Briefcase,
  FileText,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  MessageCircle,
  Bot,
  FileCheck,
  Sparkles,
  Building2,
  MapPin,
  Calendar,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000";

const statusMeta = {
  pending: {
    label: "Pending",
    badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
    icon: Clock,
  },
  reviewed: {
    label: "Reviewed",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    icon: Eye,
  },
  accepted: {
    label: "Accepted",
    badge: "bg-green-500/10 text-green-300 border-green-500/30",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    badge: "bg-red-500/10 text-red-300 border-red-500/30",
    icon: XCircle,
  },
};

const jobTypeLabels = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  remote: "Remote",
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatSalary = (job) => {
  if (!job?.salary_range) return "Not disclosed";
  const prefix = job.currency ? `${job.currency} ` : "";
  return `${prefix}${job.salary_range}`;
};

const JobseekerDashboard = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewed: 0,
    accepted: 0,
    rejected: 0,
  });
  const [jobsTotal, setJobsTotal] = useState(0);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const token = await getToken({ template: "default" });
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const statuses = ["pending", "reviewed", "accepted", "rejected"];

        const appsRequest = axios.get(
          `${API_BASE_URL}/api/applications/my-applications`,
          {
            params: { page: 1, limit: 5 },
            headers,
          }
        );

        const jobsRequest = axios.get(`${API_BASE_URL}/api/jobs`, {
          params: { page: 1, limit: 5, sort_by: "created_at", sort_order: "DESC" },
        });

        const conversationsRequest = axios.get(
          `${API_BASE_URL}/api/messages/conversations`,
          { headers }
        );

        const statusRequests = Promise.all(
          statuses.map((status) =>
            axios.get(`${API_BASE_URL}/api/applications/my-applications`, {
              params: { page: 1, limit: 1, status },
              headers,
            })
          )
        );

        const results = await Promise.allSettled([
          appsRequest,
          jobsRequest,
          conversationsRequest,
          statusRequests,
        ]);

        if (!active) return;

        const [appsResult, jobsResult, convResult, statusResult] = results;
        const errors = [];

        if (appsResult.status === "fulfilled") {
          const appData = appsResult.value.data || {};
          setApplications(appData.applications || []);
          const total = appData.pagination?.totalApplications ?? 0;
          setStats((prev) => ({ ...prev, total }));
        } else {
          errors.push("Applications failed to load.");
        }

        if (jobsResult.status === "fulfilled") {
          const jobData = jobsResult.value.data || {};
          setJobs(jobData.jobs || []);
          setJobsTotal(
            jobData.pagination?.totalJobs ?? jobData.jobs?.length ?? 0
          );
        } else {
          errors.push("Jobs failed to load.");
        }

        if (convResult.status === "fulfilled") {
          setConversations(convResult.value.data?.conversations || []);
        } else {
          setConversations([]);
        }

        if (statusResult.status === "fulfilled") {
          const counts = statusResult.value.reduce((acc, response, index) => {
            acc[statuses[index]] =
              response?.data?.pagination?.totalApplications ?? 0;
            return acc;
          }, {});
          setStats((prev) => ({ ...prev, ...counts }));
        }

        if (errors.length > 0) {
          setError(errors.join(" "));
        }
      } catch (err) {
        if (!active) return;
        console.error("Dashboard load error:", err);
        setError(
          err.response?.data?.message || "Failed to load dashboard data."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [getToken]);

  const greetingName =
    user?.firstName || user?.fullName || user?.username || "there";

  const recentApplications = useMemo(
    () => applications.slice(0, 4),
    [applications]
  );
  const recentJobs = useMemo(() => jobs.slice(0, 4), [jobs]);
  const recentConversations = useMemo(
    () => conversations.slice(0, 3),
    [conversations]
  );

  const statCards = [
    {
      label: "Total Applications",
      value: stats.total,
      icon: FileText,
      accent: "text-indigo-300",
      border: "border-indigo-500/30",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      accent: "text-yellow-300",
      border: "border-yellow-500/30",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Reviewed",
      value: stats.reviewed,
      icon: Eye,
      accent: "text-blue-300",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
    },
    {
      label: "Accepted",
      value: stats.accepted,
      icon: CheckCircle,
      accent: "text-green-300",
      border: "border-green-500/30",
      bg: "bg-green-500/10",
    },
    {
      label: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      accent: "text-red-300",
      border: "border-red-500/30",
      bg: "bg-red-500/10",
    },
    {
      label: "Open Jobs",
      value: jobsTotal,
      icon: Briefcase,
      accent: "text-cyan-300",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-indigo-300">Welcome back, {greetingName}</p>
            <h1 className="text-3xl font-bold text-white">Jobseeker Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Track your applications, explore new roles, and keep your prep on
              track.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/jobs")}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-2"
            >
              <Briefcase size={16} />
              Browse Jobs
            </button>
            <button
              onClick={() => navigate("/chatbot")}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-indigo-500 text-gray-200 text-sm font-medium flex items-center gap-2"
            >
              <Bot size={16} />
              Career Chatbot
            </button>
            <button
              onClick={() => navigate("/ats")}
              className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-indigo-500 text-gray-200 text-sm font-medium flex items-center gap-2"
            >
              <FileCheck size={16} />
              ATS Checker
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-gray-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            Loading your dashboard...
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className={`rounded-xl border ${stat.border} ${stat.bg} p-4 flex items-center justify-between`}
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`h-10 w-10 rounded-full bg-gray-900/60 border border-gray-800 flex items-center justify-center ${stat.accent}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="text-indigo-300" size={20} />
                      <h2 className="text-lg font-semibold">
                        Recent Applications
                      </h2>
                    </div>
                    <button
                      onClick={() => navigate("/applications")}
                      className="text-sm text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                    >
                      View all
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {recentApplications.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <p>You have not applied yet.</p>
                      <button
                        onClick={() => navigate("/jobs")}
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium"
                      >
                        Explore jobs
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentApplications.map((app) => {
                        const meta = statusMeta[app.status] || statusMeta.pending;
                        const StatusIcon = meta.icon;
                        return (
                          <div
                            key={app.id}
                            className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-500/40 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-white font-semibold">
                                  {app.job_title}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Building2 size={14} />
                                    {app.company}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    {app.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Briefcase size={14} />
                                    {jobTypeLabels[app.job_type] || app.job_type}
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 ${meta.badge}`}
                              >
                                <StatusIcon size={12} />
                                {meta.label}
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                Applied {formatDate(app.created_at)}
                              </span>
                              <button
                                onClick={() => navigate(`/jobs/${app.job_id}`)}
                                className="text-indigo-300 hover:text-indigo-200 text-xs font-medium"
                              >
                                View job
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-cyan-300" size={20} />
                    <h2 className="text-lg font-semibold">Next Best Steps</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        title: "Optimize your resume",
                        body: "Run the ATS checker to spot gaps before applying.",
                        action: "Run ATS",
                        onClick: () => navigate("/ats"),
                      },
                      {
                        title: "Prep for interviews",
                        body: "Use the chatbot for structured interview practice.",
                        action: "Open Chatbot",
                        onClick: () => navigate("/chatbot"),
                      },
                      {
                        title: "Find new roles",
                        body: "Explore fresh openings and apply quickly.",
                        action: "Browse jobs",
                        onClick: () => navigate("/jobs"),
                      },
                    ].map((step) => (
                      <div
                        key={step.title}
                        className="bg-gray-900/70 border border-gray-700 rounded-xl p-4 flex flex-col justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">{step.title}</p>
                          <p className="text-sm text-gray-400 mt-1">{step.body}</p>
                        </div>
                        <button
                          onClick={step.onClick}
                          className="mt-4 text-sm text-indigo-300 hover:text-indigo-200 font-medium"
                        >
                          {step.action} →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Briefcase className="text-indigo-300" size={20} />
                      <h2 className="text-lg font-semibold">Latest Jobs</h2>
                    </div>
                    <button
                      onClick={() => navigate("/jobs")}
                      className="text-sm text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                    >
                      See all
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {recentJobs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      No jobs available right now.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentJobs.map((job) => (
                        <div
                          key={job.id}
                          className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 hover:border-indigo-500/40 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-semibold">
                                {job.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                <Building2 size={14} />
                                {job.company}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDate(job.created_at)}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase size={14} />
                              {jobTypeLabels[job.job_type] || job.job_type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatSalary(job)}
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`/jobs/${job.id}`)}
                            className="mt-3 text-sm text-indigo-300 hover:text-indigo-200 font-medium"
                          >
                            View role →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="text-indigo-300" size={20} />
                      <h2 className="text-lg font-semibold">Recent Messages</h2>
                    </div>
                    <button
                      onClick={() => navigate("/messages")}
                      className="text-sm text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                    >
                      Open inbox
                      <ArrowUpRight size={14} />
                    </button>
                  </div>

                  {recentConversations.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      No conversations yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentConversations.map((conv) => (
                        <button
                          key={conv.applicationId}
                          onClick={() => navigate("/messages")}
                          className="w-full text-left bg-gray-900/60 border border-gray-700 rounded-xl p-4 hover:border-indigo-500/40 transition"
                        >
                          <p className="text-sm text-gray-300">
                            {conv.jobTitle} at {conv.company}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {conv.otherPartyEmail}
                          </p>
                          <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                            {conv.lastMessage || "No messages yet"}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default JobseekerDashboard;
