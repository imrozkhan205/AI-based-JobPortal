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
  FileText
} from 'lucide-react';

const MyApplicationsPage = () => {
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

  if (loading && applications.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
          <span className="ml-3 text-gray-400">Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Applications</h1>
        <p className="text-gray-400">Track all your job applications in one place</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-gray-300 font-medium">Filter by status:</label>
        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-colors"
        >
          <option value="">All Applications</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Applications List */}
      {error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchApplications}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-white mb-2">No Applications Yet</h3>
          <p className="text-gray-400 mb-6">
            {filterStatus ? `No ${filterStatus} applications found.` : "You haven't applied to any jobs yet. Start exploring opportunities!"}
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            Browse Jobs
          </button>
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
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors cursor-pointer"
                  onClick={() => navigate(`/jobs/${application.job_id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {application.job_title}
                      </h3>
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <span className="flex items-center">
                          <Building size={14} className="mr-1" />
                          {application.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {application.location}
                        </span>
                        <span className="flex items-center">
                          <Briefcase size={14} className="mr-1" />
                          {jobTypes[application.job_type]}
                        </span>
                      </div>
                    </div>

                    <div className={`flex items-center px-3 py-1.5 rounded-lg border ${statusBadge.color} text-sm font-medium`}>
                      <StatusIcon size={14} className="mr-2" />
                      {statusBadge.label}
                    </div>
                  </div>

                  {application.salary_range && (
                    <div className="mb-4 text-green-400 font-medium">
                      {`${getCurrencySymbol(application.currency)}${application.salary_range}`}
                    </div>
                  )}

                  {application.cover_letter && (
                    <div className="mb-4">
                      <p className="text-gray-300 text-sm line-clamp-2">
                        <span className="font-medium text-gray-400">Cover Letter: </span>
                        {application.cover_letter}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="flex items-center">
                      <Calendar size={14} className="mr-1" />
                      Applied {formatDate(application.created_at)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${application.job_id}`);
                      }}
                      className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                    >
                      View Job Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-gray-400 text-sm">
                Showing {applications.length} of {pagination.totalApplications} applications
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyApplicationsPage;