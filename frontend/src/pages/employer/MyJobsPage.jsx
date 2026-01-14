import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Edit, 
  Trash2, 
  Eye,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Building,
  Clock
} from 'lucide-react';

const MyJobsPage = () => {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);

  const currencies = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CNY: '¥',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ'
  };
  const getCurrencySymbol = (code) => currencies[code] || '';

  const jobTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' }
  ];

  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);
      const token = await getToken({ template: "default" });
      
      const response = await axios.get(
        `http://localhost:5000/api/jobs/employer/my-jobs?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setJobs(response.data.jobs);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load your jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      const token = await getToken({ template: "default" });
      
      await axios.delete(
        `http://localhost:5000/api/jobs/${jobToDelete.id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Refresh the jobs list
      fetchJobs(pagination.currentPage);
      setShowDeleteModal(false);
      setJobToDelete(null);
      
      // Show success message
      alert('Job deleted successfully!');
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  const confirmDelete = (job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || job.job_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getJobTypeColor = (jobType) => {
    const colors = {
      'full-time': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'part-time': 'bg-green-500/20 text-green-400 border-green-500/30',
      'contract': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'freelance': 'bg-white-500/20 text-white-400 border-white-500/30',
      'internship': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'remote': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    };
    return colors[jobType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white-400"></div>
          <span className="ml-3 text-gray-400">Loading your jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Job Postings</h1>
            <p className="text-gray-400">
              Manage and track your job postings ({pagination.totalJobs} total)
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/create-job'}
            className="flex items-center px-4 py-2 bg-white-500 hover:bg-white-600 text-white rounded-lg transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Post New Job
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search jobs by title, company, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-white-500 appearance-none cursor-pointer "
            >
              {jobTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="mx-auto text-gray-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            {searchTerm || filterType !== 'all' ? 'No jobs found' : 'No jobs posted yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Start by posting your first job to attract candidates'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => window.location.href = '/create-job'}
              className="px-6 py-2 bg-white-500 hover:bg-white-600 text-white rounded-lg transition-colors"
            >
              Post Your First Job
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-white-500/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getJobTypeColor(job.job_type)}`}>
                      {jobTypes.find(type => type.value === job.job_type)?.label}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-4">
                    <span className="flex items-center">
                      <Building size={16} className="mr-1" />
                      {job.company}
                    </span>
                    <span className="flex items-center">
                      <MapPin size={16} className="mr-1" />
                      {job.location}
                    </span>
                    {job.salary_range && (
                      <span className="flex items-center">
                        {/* <DollarSign size={16} className="mr-1" /> */}
                        {`${getCurrencySymbol(job.currency)}${job.salary_range}`}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      Posted {formatDate(job.created_at)}
                    </span>
                  </div>

                  <p className="text-gray-300 line-clamp-2 mb-4">
                    {job.description.substring(0, 150)}...
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      ID: {job.id}
                    </span>
                    {job.updated_at && job.updated_at !== job.created_at && (
                      <span className="text-xs text-gray-500">
                        • Updated {formatDate(job.updated_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => window.location.href = `/jobs/${job.id}`}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    title="View Job"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => window.location.href = `/edit-job/${job.id}`}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Edit Job"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => confirmDelete(job)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-400">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchJobs(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="flex items-center px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-white-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </button>
            <button
              onClick={() => fetchJobs(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="flex items-center px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-white-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Job</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyJobsPage;