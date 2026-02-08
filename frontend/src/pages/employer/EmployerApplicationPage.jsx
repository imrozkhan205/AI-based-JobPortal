import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  MapPin, 
  Briefcase, 
  Building, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  FileText,
  Filter,
  Loader,
  Mail,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const EmployerApplicationsPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedApplications, setExpandedApplications] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    fetchMyJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchApplicationsForJob(selectedJob.id);
    }
  }, [selectedJob, filterStatus]);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const token = await getToken({ template: "default" });
      
      const response = await axios.get(
        'http://localhost:5000/api/jobs/employer/my-jobs?limit=100',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMyJobs(response.data.jobs);
      
      // Auto-select first job if available
      if (response.data.jobs.length > 0) {
        setSelectedJob(response.data.jobs[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load your jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsForJob = async (jobId) => {
    try {
      setApplicationsLoading(true);
      const token = await getToken({ template: "default" });
      
      const params = new URLSearchParams({
        limit: 100
      });
      
      if (filterStatus) {
        params.append('status', filterStatus);
      }

      const response = await axios.get(
        `http://localhost:5000/api/applications/job/${jobId}?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setApplications(response.data.applications);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again.');
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [applicationId]: true }));
      const token = await getToken({ template: "default" });
      
      console.log('🔄 Updating application:', { applicationId, newStatus });
      
      const response = await axios.patch(
        `http://localhost:5000/api/applications/${applicationId}/status`,
        { status: newStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Update successful:', response.data);

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      );

      alert(`Application status updated to ${newStatus}!`);
    } catch (err) {
      console.error('❌ Error updating status:', err);
      console.error('Response data:', err.response?.data);
      console.error('Status code:', err.response?.status);
      
      const errorMessage = err.response?.data?.message || 'Failed to update application status. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  const toggleExpandApplication = (applicationId) => {
    setExpandedApplications(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { 
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 
        icon: Clock, 
        label: 'Pending' 
      },
      reviewed: { 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
        icon: Eye, 
        label: 'Reviewed' 
      },
      accepted: { 
        color: 'bg-green-500/20 text-green-400 border-green-500/30', 
        icon: CheckCircle, 
        label: 'Accepted' 
      },
      rejected: { 
        color: 'bg-red-500/20 text-red-400 border-red-500/30', 
        icon: XCircle, 
        label: 'Rejected' 
      }
    };
    return badges[status] || badges.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getApplicationStats = () => {
    if (!applications.length) {
      return { total: 0, pending: 0, reviewed: 0, accepted: 0, rejected: 0 };
    }

    return applications.reduce((acc, app) => {
      acc.total++;
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, { total: 0, pending: 0, reviewed: 0, accepted: 0, rejected: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin h-8 w-8 text-orange-400" />
          <span className="ml-3 text-gray-400">Loading your jobs...</span>
        </div>
      </div>
    );
  }

  if (myJobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Job Applications</h1>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <Briefcase size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Jobs Posted Yet</h3>
            <p className="text-gray-400 mb-6">
              You need to post jobs before you can receive applications.
            </p>
            <button
              onClick={() => navigate('/post-job')}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
            >
              Post a Job
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getApplicationStats();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Job Applications</h1>
          <p className="text-gray-400">Manage applications for your job postings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Job List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Briefcase size={20} className="mr-2" />
                Your Jobs ({myJobs.length})
              </h2>
              <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {myJobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedJob?.id === job.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-900 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium truncate">{job.title}</div>
                    <div className="text-sm opacity-80 truncate mt-1">
                      {job.company}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Applications */}
          <div className="lg:col-span-3">
            {selectedJob && (
              <>
                {/* Selected Job Header */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedJob.title}</h2>
                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <span className="flex items-center">
                      <Building size={14} className="mr-1" />
                      {selectedJob.company}
                    </span>
                    <span className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {selectedJob.location}
                    </span>
                    <span className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      Posted {formatDate(selectedJob.created_at)}
                    </span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Total</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                  </div>
                  <div className="bg-gray-800 border border-yellow-500/30 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Pending</div>
                    <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
                  </div>
                  <div className="bg-gray-800 border border-blue-500/30 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Reviewed</div>
                    <div className="text-2xl font-bold text-blue-400">{stats.reviewed}</div>
                  </div>
                  <div className="bg-gray-800 border border-green-500/30 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Accepted</div>
                    <div className="text-2xl font-bold text-green-400">{stats.accepted}</div>
                  </div>
                  <div className="bg-gray-800 border border-red-500/30 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">Rejected</div>
                    <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
                  </div>
                </div>

                {/* Filter */}
                <div className="mb-6 flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <Filter size={20} className="text-gray-400" />
                  <label className="text-gray-300 font-medium">Filter:</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
                  >
                    <option value="">All Applications</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {filterStatus && (
                    <button
                      onClick={() => setFilterStatus('')}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Applications List */}
                {applicationsLoading ? (
                  <div className="flex items-center justify-center h-64 bg-gray-800 border border-gray-700 rounded-xl">
                    <Loader className="animate-spin h-8 w-8 text-orange-400" />
                    <span className="ml-3 text-gray-400">Loading applications...</span>
                  </div>
                ) : error ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                    <XCircle size={48} className="mx-auto mb-4 text-red-400" />
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={() => fetchApplicationsForJob(selectedJob.id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                    <FileText size={64} className="mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Applications Yet</h3>
                    <p className="text-gray-400">
                      {filterStatus 
                        ? `No ${filterStatus} applications for this job.`
                        : 'This job hasn\'t received any applications yet.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => {
                      const statusBadge = getStatusBadge(application.status);
                      const StatusIcon = statusBadge.icon;
                      const isExpanded = expandedApplications[application.id];

                      return (
                        <div
                          key={application.id}
                          className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
                        >
                          {/* Application Header */}
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-gray-700 rounded-full p-2">
                                    <User size={20} className="text-gray-400" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                      <Mail size={16} className="text-gray-400" />
                                      {application.applicant_email}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                      Applied {formatDate(application.created_at)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className={`flex items-center px-3 py-1.5 rounded-lg border ${statusBadge.color} text-sm font-medium`}>
                                <StatusIcon size={14} className="mr-2" />
                                {statusBadge.label}
                              </div>
                            </div>

                            {/* Cover Letter Preview */}
                            {application.cover_letter && (
                              <div className="mb-4">
                                <button
                                  onClick={() => toggleExpandApplication(application.id)}
                                  className="flex items-center text-orange-400 hover:text-orange-300 transition-colors text-sm font-medium mb-2"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp size={16} className="mr-1" />
                                      Hide Cover Letter
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown size={16} className="mr-1" />
                                      View Cover Letter
                                    </>
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                      {application.cover_letter}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Resume Attachment */}
                            {application.resume_url && (
                              <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText size={16} className="text-orange-400" />
                                  <span className="text-sm font-medium text-gray-300">Resume Attachment</span>
                                </div>
                                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                  <a
                                    href={application.resume_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
                                  >
                                    <FileText size={16} />
                                    View Resume in Cloudinary
                                  </a>
                                  <p className="text-xs text-gray-400 mt-2">
                                    Opens the resume in a new tab for viewing
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-700">
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'reviewed')}
                                disabled={application.status === 'reviewed' || updatingStatus[application.id]}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center"
                              >
                                <Eye size={14} className="mr-2" />
                                {updatingStatus[application.id] ? 'Updating...' : 'Mark as Reviewed'}
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'accepted')}
                                disabled={application.status === 'accepted' || updatingStatus[application.id]}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center"
                              >
                                <CheckCircle size={14} className="mr-2" />
                                Accept
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                disabled={application.status === 'rejected' || updatingStatus[application.id]}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium flex items-center"
                              >
                                <XCircle size={14} className="mr-2" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerApplicationsPage;
