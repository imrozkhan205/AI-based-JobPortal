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
  Loader
} from 'lucide-react';

const ApplicationsPage = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const currencies = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CNY: '¥',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ'
  };
  const getCurrencySymbol = (code) => currencies[code] || '';

  const jobTypes = {
    'full-time': 'Full Time',
    'part-time': 'Part Time',
    'contract': 'Contract',
    'freelance': 'Freelance',
    'internship': 'Internship',
    'remote': 'Remote'
  };

  useEffect(() => {
    fetchApplications();
  }, [currentPage, filterStatus]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = await getToken({ template: "default" });
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });
      
      if (filterStatus) {
        params.append('status', filterStatus);
      }

      const response = await axios.get(
        `http://localhost:5000/api/applications/my-applications?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setApplications(response.data.applications);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
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
      day: 'numeric'
    });
  };

  const getStatusStats = () => {
    const stats = {
      total: applications.length,
      pending: 0,
      reviewed: 0,
      accepted: 0,
      rejected: 0
    };

    applications.forEach(app => {
      stats[app.status] = (stats[app.status] || 0) + 1;
    });

    return stats;
  };

  if (loading && applications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin h-8 w-8 text-orange-400" />
          <span className="ml-3 text-gray-400">Loading your applications...</span>
        </div>
      </div>
    );
  }

  const stats = pagination ? null : getStatusStats();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Applications</h1>
          <p className="text-gray-400">Track all your job applications in one place</p>
        </div>

        {/* Stats Cards */}
        {!filterStatus && pagination && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Applications</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {pagination.totalApplications}
                  </p>
                </div>
                <FileText className="text-gray-600" size={32} />
              </div>
            </div>

            <div className="bg-gray-800 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">
                    {applications.filter(a => a.status === 'pending').length}
                  </p>
                </div>
                <Clock className="text-yellow-500/50" size={32} />
              </div>
            </div>

            <div className="bg-gray-800 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Reviewed</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {applications.filter(a => a.status === 'reviewed').length}
                  </p>
                </div>
                <Eye className="text-blue-500/50" size={32} />
              </div>
            </div>

            <div className="bg-gray-800 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Accepted</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">
                    {applications.filter(a => a.status === 'accepted').length}
                  </p>
                </div>
                <CheckCircle className="text-green-500/50" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
          <Filter size={20} className="text-gray-400" />
          <label className="text-gray-300 font-medium">Filter by status:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
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
              onClick={() => {
                setFilterStatus('');
                setCurrentPage(1);
              }}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Applications List */}
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <XCircle size={48} className="mx-auto mb-4 text-red-400" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchApplications}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
            <FileText size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-2xl font-semibold text-white mb-2">No Applications Yet</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {filterStatus 
                ? `No ${filterStatus} applications found. Try a different filter.` 
                : "You haven't applied to any jobs yet. Start exploring opportunities and apply to positions that match your skills!"}
            </p>
            {!filterStatus && (
              <button
                onClick={() => navigate('/jobs')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium inline-flex items-center"
              >
                <Briefcase size={18} className="mr-2" />
                Browse Jobs
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {applications.map((application) => {
                const statusBadge = getStatusBadge(application.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={application.id}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all cursor-pointer hover:shadow-lg"
                    onClick={() => navigate(`/jobs/${application.job_id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2 hover:text-orange-400 transition-colors">
                          {application.job_title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-gray-400 text-sm">
                          <span className="flex items-center">
                            <Building size={14} className="mr-1.5" />
                            {application.company}
                          </span>
                          <span className="flex items-center">
                            <MapPin size={14} className="mr-1.5" />
                            {application.location}
                          </span>
                          <span className="flex items-center">
                            <Briefcase size={14} className="mr-1.5" />
                            {jobTypes[application.job_type]}
                          </span>
                        </div>
                      </div>

                      <div className={`flex items-center px-3 py-1.5 rounded-lg border ${statusBadge.color} text-sm font-medium whitespace-nowrap`}>
                        <StatusIcon size={14} className="mr-2" />
                        {statusBadge.label}
                      </div>
                    </div>

                    {application.salary_range && (
                      <div className="mb-4 text-green-400 font-semibold text-lg">
                        {`${getCurrencySymbol(application.currency)}${application.salary_range}`}
                      </div>
                    )}

                    {application.cover_letter && (
                      <div className="mb-4 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                        <p className="text-gray-400 text-xs font-medium mb-2 uppercase tracking-wide">Your Cover Letter</p>
                        <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
                          {application.cover_letter}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <span className="flex items-center text-sm text-gray-400">
                        <Calendar size={14} className="mr-1.5" />
                        Applied on {formatDate(application.created_at)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${application.job_id}`);
                        }}
                        className="text-orange-400 hover:text-orange-300 transition-colors font-medium text-sm flex items-center"
                      >
                        View Job Details
                        <span className="ml-1">→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="text-gray-400 text-sm">
                  Showing <span className="text-white font-medium">{applications.length}</span> of{' '}
                  <span className="text-white font-medium">{pagination.totalApplications}</span> applications
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    disabled={!pagination.hasPrevPage || loading}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 text-gray-300 font-medium">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNextPage || loading}
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationsPage;