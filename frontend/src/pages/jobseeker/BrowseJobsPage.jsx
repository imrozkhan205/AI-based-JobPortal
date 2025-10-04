import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar,
  Search,
  Filter,
  Building,
  Clock,
  Upload,
  User,
  X,
  Loader2, 
  FileText,
  Zap,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Renamed component for clarity based on its new purpose
const BrowseJobsPage = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  // --- State for Job Data and Loading ---
  const [jobs, setJobs] = useState([]); // Stores the recommended/filtered jobs
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filtered, setFilteredJobs] = useState('');

  // --- State for Resume Analysis ---
  const [resumeFile, setResumeFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [resumeTextPreview, setResumeTextPreview] = useState(null); // To show a preview of extracted text
  
  // Cleaned up unused employer states
  const selectedJob = null; // No need for single job focus
  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' }
  ];

  const getJobTypeLabel = (value) => {
    return jobTypes.find(type => type.value === value)?.label || value;
  };

  // --- Effects ---

  // Initial load: Check if a previous analysis result exists (optional, keeping it simple for now)
  useEffect(() => {
    // For a Job Seeker, we typically start by prompting for a resume unless we cache results.
    // Setting jobs to empty initially and loading to false to show the upload prompt.
    setLoading(false); 
    setJobs([]);
    setAnalysisSuccess(false);
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchTerm, filterType, jobs]);

  // --- Resume Upload and Analysis Logic ---

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        // Basic file type validation (PDF/DOCX)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Only PDF and Word documents are allowed.');
            setResumeFile(null);
            return;
        }
        setResumeFile(file);
        setAnalysisError(null); // Clear previous errors
    }
  };

  const handleAnalyzeResume = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
        setAnalysisError('Please select a resume file to upload.');
        return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(false);

    try {
        const token = await getToken({ template: "default" });
        const formData = new FormData();
        formData.append('resume', resumeFile);

        const response = await axios.post(
            'http://localhost:5000/api/resume/analyze', // Your backend endpoint
            formData,
            {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data' 
                },
                timeout: 60000 // Give the BERT service plenty of time
            }
        );

        if (response.data.success) {
            setJobs(response.data.matchedJobs); // Recommended jobs are now the primary list
            setResumeTextPreview(response.data.resumeText);
            setAnalysisSuccess(true);
            setFilterType('all'); // Reset filters
            setSearchTerm('');
        } else {
            throw new Error(response.data.message || 'Job analysis failed.');
        }
    } catch (error) {
        console.error('Error during resume analysis:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to connect to the analysis service.';
        setAnalysisError(`Analysis Error: ${errorMessage}`);
        setJobs([]); // Clear previous jobs on error
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- Filtering ---
const filterJobs = () => {
  let filtered = [...jobs];

  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Type filter (using filterType for job type)
  if (filterType !== 'all') {
    filtered = filtered.filter(job => job.job_type === filterType);
  }

  // THIS LINE MUST BE CORRECT:
  setFilteredJobs(filtered); 
};

  // --- Job Seeker Components ---

  const JobCard = ({ job }) => (
    // Note: The score is typically provided by the BERT service
    <div className="p-6 border rounded-lg shadow-sm mb-4 bg-white hover:shadow-md transition duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
            {job.title}
          </h2>
          <p className="text-sm text-gray-500 flex items-center mt-1">
            <Building className="w-4 h-4 mr-1" />{job.company}
          </p>
        </div>
        
        {/* Match Score Display (if available) */}
        {job.match_score !== undefined && (
             <div className="flex flex-col items-center">
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${job.match_score >= 0.75 ? 'bg-green-100 text-green-800' : job.match_score >= 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                    {Math.round(job.match_score * 100)}% Match
                </span>
                <span className="text-xs text-gray-500 mt-1">BERT AI</span>
            </div>
        )}

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-gray-600">
        <p className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-red-500" />{job.location}</p>
        <p className="flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-500" />{job.salary_range || 'N/A'}</p>
        <p className="flex items-center"><Clock className="w-4 h-4 mr-1 text-blue-500" />{getJobTypeLabel(job.job_type)}</p>
        <p className="flex items-center"><Calendar className="w-4 h-4 mr-1 text-purple-500" />Posted: {new Date(job.created_at).toLocaleDateString()}</p>
      </div>
      
      {/* Short Description Preview */}
      <p className="text-gray-700 mt-4 line-clamp-2">
        {job.description ? `${job.description.substring(0, 150)}...` : 'No description provided.'}
      </p>

      <div className="mt-4 flex space-x-2 justify-end">
        <button
          onClick={() => navigate(`/jobs/${job.id}`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 flex items-center"
          title="View Details"
        >
          <Eye className="w-5 h-5 mr-2" /> View Job
        </button>
      </div>
    </div>
  );

  const UploadResumeSection = () => (
    <div className="bg-white p-10 rounded-xl shadow-2xl max-w-2xl mx-auto my-20 border border-indigo-200">
      <div className="text-center mb-6">
        <Zap className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-800">Get Personalized Job Recommendations</h2>
        <p className="text-gray-600 mt-2">Upload your resume and our **BERT AI** will match your skills to the perfect jobs.</p>
      </div>

      <form onSubmit={handleAnalyzeResume} className="space-y-6">
        {/* File Input */}
        <div className="flex items-center justify-center w-full">
          <label 
            htmlFor="resume-upload" 
            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition duration-300 ${
                resumeFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {resumeFile ? (
                <>
                  <FileText className="w-8 h-8 mb-2 text-green-600" />
                  <p className="mb-2 text-sm text-green-600 font-medium">{resumeFile.name}</p>
                  <p className="text-xs text-gray-500">File ready for analysis. Click the button below.</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOCX (Max 5MB)</p>
                </>
              )}
            </div>
            <input id="resume-upload" type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
          </label>
        </div>

        {/* Error Display */}
        {analysisError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center text-sm">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p>{analysisError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full px-4 py-3 rounded-lg text-white font-semibold transition duration-300 flex items-center justify-center ${
            isAnalyzing || !resumeFile ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
          }`}
          disabled={isAnalyzing || !resumeFile}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Resume with BERT...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Analyze & Find Matches
            </>
          )}
        </button>
      </form>
    </div>
  );

  // --- Main Render ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="ml-2 text-lg text-gray-600">Preparing job data...</p>
      </div>
    );
  }

  // If no jobs have been loaded yet, show the upload prompt
  if (!analysisSuccess && jobs.length === 0) {
    return <UploadResumeSection />;
  }
  
  // Display Recommended Jobs view
  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 border-b pb-4">
        <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
              <Zap className="w-7 h-7 mr-3 text-indigo-600" />
              Recommended Jobs ({filteredJobs.length} of {jobs.length})
            </h1>
            {analysisSuccess && resumeTextPreview && (
                <div className="mt-2 flex items-center text-sm text-green-700 bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-medium">Analysis successful.</span> Matched against your resume (preview: "{resumeTextPreview.trim()}...")
                </div>
            )}
        </div>
        <button
            onClick={() => { setAnalysisSuccess(false); setJobs([]); setResumeFile(null); }}
            className="mt-4 md:mt-0 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition duration-200 flex items-center shadow-md"
        >
            <X className="w-5 h-5 mr-2" />
            Clear Analysis & Upload New Resume
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search within recommended jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {/* Filter by Job Type */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
          >
            <option value="all">All Job Types</option>
            {jobTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow-lg">
            <User className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="mt-4 text-lg text-gray-700">
              {jobs.length === 0 
                ? "The AI found no matching jobs based on your resume." 
                : "No jobs match your current filter and search."
              }
            </p>
            {jobs.length > 0 && (
                <button
                    onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    Clear Filters to See All {jobs.length} Recommendations
                </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseJobsPage;