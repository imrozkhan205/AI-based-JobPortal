import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  MapPin, 
  Briefcase, 
  Building, 
  Calendar,
  ArrowLeft,
  Edit,
  Trash2,
  UserCheck,
  CheckCircle,
  Clock
} from 'lucide-react';

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  const currencies = {
    USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥', CNY: '¥',
    AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ'
  };
  const getCurrencySymbol = (code) => currencies[code] || '';

  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' }
  ];

  useEffect(() => {
    const fetchJobAndUserRole = async () => {
      try {
        setLoading(true);
        
        // Fetch job details
        const jobResponse = await axios.get(`http://localhost:5000/api/jobs/${id}`);
        setJob(jobResponse.data);

        // If user is signed in, fetch their role and check application status
        if (isSignedIn) {
          const token = await getToken({ template: "default" });
          const userResponse = await axios.get("http://localhost:5000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          setUserRole(userResponse.data.role);
          
          // Check if current user is the job owner
          if (userResponse.data.role === 'employer') {
            const myJobsResponse = await axios.get(
              `http://localhost:5000/api/jobs/employer/my-jobs`,
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            
            const isJobOwner = myJobsResponse.data.jobs.some(j => j.id === parseInt(id));
            setIsOwner(isJobOwner);
          }
          
          // Check if user has already applied (for jobseekers)
          if (userResponse.data.role === 'jobseeker') {
            try {
              const statusResponse = await axios.get(
                `http://localhost:5000/api/applications/check/${id}`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              setApplicationStatus(statusResponse.data);
            } catch (err) {
              console.error('Error checking application status:', err);
            }
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching job:', err);
        if (err.response?.status === 404) {
          setError('Job not found');
        } else {
          setError('Failed to load job details. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobAndUserRole();
  }, [id, isSignedIn, getToken]);

  const handleApplyForJob = async () => {
    if (!coverLetter.trim()) {
      alert('Please write a cover letter before applying');
      return;
    }

    try {
      setApplying(true);
      const token = await getToken({ template: "default" });
      
      await axios.post(
        `http://localhost:5000/api/applications/${id}`,
        { coverLetter },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setShowApplyModal(false);
      setApplicationStatus({ hasApplied: true, application: { status: 'pending' } });
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error applying for job:', err);
      if (err.response?.status === 400) {
        alert(err.response.data.message);
      } else {
        alert('Failed to submit application. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  const handleDeleteJob = async () => {
    try {
      const token = await getToken({ template: "default" });
      
      await axios.delete(
        `http://localhost:5000/api/jobs/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setShowDeleteModal(false);
      navigate('/my-jobs');
      alert('Job deleted successfully!');
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getJobTypeColor = (jobType) => {
    const colors = {
      'full-time': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'part-time': 'bg-green-500/20 text-green-400 border-green-500/30',
      'contract': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'freelance': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'internship': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'remote': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    };
    return colors[jobType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock, label: 'Pending' },
      reviewed: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock, label: 'Reviewed' },
      accepted: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: Clock, label: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
          <span className="ml-3 text-gray-400">Loading job details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-400 mb-4">{error}</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-400 mb-4">Job not found</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
            <div className="flex items-center gap-4 text-gray-400 mb-4">
              <span className="flex items-center">
                <Building size={16} className="mr-1" />
                {job.company}
              </span>
              <span className="flex items-center">
                <MapPin size={16} className="mr-1" />
                {job.location}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getJobTypeColor(job.job_type)}`}>
                {jobTypes.find(type => type.value === job.job_type)?.label}
              </span>
            </div>
            {job.salary_range && (
              <div className="flex items-center text-green-400 font-medium mb-4">
                {`${getCurrencySymbol(job.currency)}${job.salary_range}`}
              </div>
            )}
          </div>

          {/* Action buttons for job owner */}
          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/edit-job/${job.id}`)}
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Edit size={16} className="mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            </div>
          )}

          {/* Apply button for jobseekers */}
          {userRole === 'jobseeker' && isSignedIn && (
            <div>
              {applicationStatus?.hasApplied ? (
                <div className="flex items-center gap-3">
                  {(() => {
                    const statusBadge = getStatusBadge(applicationStatus.application.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <div className={`flex items-center px-4 py-3 rounded-lg border ${statusBadge.color} font-medium`}>
                        <StatusIcon size={16} className="mr-2" />
                        Application {statusBadge.label}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <button 
                  onClick={() => setShowApplyModal(true)}
                  className="flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  <UserCheck size={16} className="mr-2" />
                  Apply Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Job Description</h2>
            <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Requirements</h2>
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </div>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Benefits</h2>
              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                {job.benefits}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Overview */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Job Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <Briefcase size={16} className="mr-3 text-gray-400" />
                <span>{jobTypes.find(type => type.value === job.job_type)?.label}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin size={16} className="mr-3 text-gray-400" />
                <span>{job.location}</span>
              </div>
              {job.salary_range && (
                <div className="flex items-center text-green-400">
                  <span>{`${getCurrencySymbol(job.currency)}${job.salary_range}`}</span>
                </div>
              )}
              <div className="flex items-center text-gray-300">
                <Calendar size={16} className="mr-3 text-gray-400" />
                <span>Posted {formatDate(job.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Company</h3>
            <div className="space-y-3">
              <div className="text-white font-medium">{job.company}</div>
              <div className="text-gray-300">{job.location}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-2xl font-semibold text-white mb-4">Apply for {job.title}</h3>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                You are applying for <span className="font-semibold text-white">{job.title}</span> at <span className="font-semibold text-white">{job.company}</span>
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Letter <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Tell us why you're a great fit for this role..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  rows={8}
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  Tip: Highlight your relevant experience and skills that match the job requirements
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setCoverLetter('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                disabled={applying}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyForJob}
                disabled={applying || !coverLetter.trim()}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Job</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{job.title}"? This action cannot be undone.
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

export default JobDetailPage;