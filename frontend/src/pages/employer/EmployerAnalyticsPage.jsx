import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import {
  BarChart3,
  Briefcase,
  FileText,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar
} from 'lucide-react';

const RANGE_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 }
];

const EmployerAnalyticsPage = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [rangeDays, setRangeDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = await getToken({ template: 'default' });
      const headers = { Authorization: `Bearer ${token}` };

      const jobsRes = await axios.get(
        'http://localhost:5000/api/jobs/employer/my-jobs?limit=100',
        { headers }
      );

      const fetchedJobs = jobsRes.data.jobs || [];
      setJobs(fetchedJobs);

      if (fetchedJobs.length === 0) {
        setApplications([]);
        setError(null);
        return;
      }

      const jobRequests = fetchedJobs.map((job) =>
        axios
          .get(`http://localhost:5000/api/applications/job/${job.id}?limit=200`, {
            headers
          })
          .then((res) => ({
            jobId: job.id,
            applications: res.data.applications || []
          }))
          .catch(() => ({
            jobId: job.id,
            applications: []
          }))
      );

      const jobApplications = await Promise.all(jobRequests);

      const jobMap = new Map(fetchedJobs.map((job) => [job.id, job]));
      const flattenedApplications = jobApplications.flatMap((entry) =>
        entry.applications.map((app) => ({
          ...app,
          job: jobMap.get(entry.jobId)
        }))
      );

      setApplications(flattenedApplications);
      setError(null);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalJobs = jobs.length;
  const totalApplications = applications.length;

  const statusCounts = useMemo(() => {
    return applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      { pending: 0, reviewed: 0, accepted: 0, rejected: 0 }
    );
  }, [applications]);

  const responseRate = totalApplications
    ? (statusCounts.reviewed + statusCounts.accepted + statusCounts.rejected) / totalApplications
    : 0;

  const averageApplicationsPerJob = totalJobs
    ? (totalApplications / totalJobs).toFixed(1)
    : '0.0';

  const rangeData = useMemo(() => {
    const now = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (rangeDays - 1));

    const bucketCount = 6;
    const bucketSize = Math.ceil(rangeDays / bucketCount);
    const buckets = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(bucketStart.getDate() + index * bucketSize);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + bucketSize - 1);
      if (bucketEnd > now) bucketEnd.setTime(now.getTime());

      return {
        label: `${bucketStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })} - ${bucketEnd.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })}`,
        count: 0,
        start: bucketStart,
        end: bucketEnd
      };
    });

    applications.forEach((app) => {
      const created = new Date(app.created_at);
      if (Number.isNaN(created.getTime()) || created < start || created > now) {
        return;
      }

      const diffDays = Math.floor((created - start) / (1000 * 60 * 60 * 24));
      const bucketIndex = Math.min(bucketCount - 1, Math.floor(diffDays / bucketSize));
      buckets[bucketIndex].count += 1;
    });

    return buckets;
  }, [applications, rangeDays]);

  const maxBucketValue = Math.max(...rangeData.map((bucket) => bucket.count), 1);

  const topJobs = useMemo(() => {
    const jobStats = jobs.map((job) => {
      const jobApps = applications.filter((app) => app.job?.id === job.id);
      const counts = jobApps.reduce(
        (acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        },
        { pending: 0, reviewed: 0, accepted: 0, rejected: 0 }
      );

      return {
        job,
        total: jobApps.length,
        counts
      };
    });

    return jobStats.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [applications, jobs]);

  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);
  }, [applications]);

  const statusMeta = {
    pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    reviewed: { label: 'Reviewed', icon: Eye, color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    accepted: { label: 'Accepted', icon: CheckCircle, color: 'bg-green-500/15 text-green-300 border-green-500/30' },
    rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-500/15 text-red-300 border-red-500/30' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-400">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-3xl mx-auto bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <XCircle size={40} className="mx-auto text-red-400 mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (totalJobs === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto bg-gray-800 border border-gray-700 rounded-2xl p-10 text-center">
          <BarChart3 size={56} className="mx-auto text-gray-500 mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">No analytics yet</h2>
          <p className="text-gray-400 mb-6">
            Post your first job to start tracking applications and performance.
          </p>
          <button
            onClick={() => (window.location.href = '/create-job')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Post a Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Employer Analytics</h1>
            <p className="text-gray-400">
              Track job performance and application trends across your postings.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg p-2">
            <Calendar size={16} className="text-gray-400" />
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setRangeDays(option.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  rangeDays === option.value
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">Total Jobs</span>
              <Briefcase size={18} className="text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">{totalJobs}</div>
            <p className="text-sm text-gray-500 mt-2">Active postings in your account</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">Total Applications</span>
              <Users size={18} className="text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white">{totalApplications}</div>
            <p className="text-sm text-gray-500 mt-2">All-time applications received</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">Avg. per Job</span>
              <TrendingUp size={18} className="text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white">{averageApplicationsPerJob}</div>
            <p className="text-sm text-gray-500 mt-2">Applications per posting</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400">Response Rate</span>
              <FileText size={18} className="text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {Math.round(responseRate * 100)}%
            </div>
            <p className="text-sm text-gray-500 mt-2">Reviewed or decided applications</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Application Trend</h2>
                <p className="text-sm text-gray-400">New applications over the last {rangeDays} days</p>
              </div>
              <BarChart3 size={18} className="text-blue-400" />
            </div>

            {totalApplications === 0 ? (
              <div className="text-center py-10 text-gray-400">
                No applications received yet.
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-3 items-end h-40">
                {rangeData.map((bucket) => (
                  <div key={bucket.label} className="flex flex-col items-center gap-2">
                    <div className="w-full bg-gray-900 rounded-lg h-28 flex items-end">
                      <div
                        className="w-full bg-blue-500/70 rounded-lg"
                        style={{
                          height: `${(bucket.count / maxBucketValue) * 100}%`
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-400 text-center leading-tight">
                      {bucket.label}
                    </div>
                    <div className="text-xs text-gray-300 font-medium">{bucket.count}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Application Status</h2>
            <div className="space-y-3">
              {Object.entries(statusMeta).map(([status, meta]) => {
                const count = statusCounts[status] || 0;
                const Icon = meta.icon;
                const width = totalApplications
                  ? Math.round((count / totalApplications) * 100)
                  : 0;

                return (
                  <div key={status} className={`border rounded-lg p-3 ${meta.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        <span className="text-sm font-medium">{meta.label}</span>
                      </div>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-gray-900/60 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-white/70"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Top Performing Jobs</h2>
            <div className="space-y-3">
              {topJobs.map((item) => (
                <div
                  key={item.job.id}
                  className="bg-gray-900/60 border border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.job.title}</h3>
                      <p className="text-sm text-gray-400">{item.job.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">{item.total}</div>
                      <p className="text-xs text-gray-400">applications</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-3">
                    <span className="px-2 py-1 bg-gray-800 rounded-lg">
                      Pending: {item.counts.pending}
                    </span>
                    <span className="px-2 py-1 bg-gray-800 rounded-lg">
                      Reviewed: {item.counts.reviewed}
                    </span>
                    <span className="px-2 py-1 bg-gray-800 rounded-lg">
                      Accepted: {item.counts.accepted}
                    </span>
                    <span className="px-2 py-1 bg-gray-800 rounded-lg">
                      Rejected: {item.counts.rejected}
                    </span>
                  </div>
                </div>
              ))}
              {topJobs.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No application activity yet.
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Applications</h2>
            <div className="space-y-3">
              {recentApplications.map((app) => {
                const statusStyle = statusMeta[app.status] || statusMeta.pending;
                const StatusIcon = statusStyle.icon;
                return (
                  <div
                    key={app.id}
                    className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{app.applicant_email}</p>
                      <p className="text-xs text-gray-400">{app.job?.title || 'Job posting'}</p>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 ${statusStyle.color}`}>
                      <StatusIcon size={12} />
                      {statusStyle.label}
                    </div>
                  </div>
                );
              })}
              {recentApplications.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No applications yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerAnalyticsPage;
