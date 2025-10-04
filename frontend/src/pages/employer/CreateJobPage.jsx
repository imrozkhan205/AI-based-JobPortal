import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { Upload, Briefcase, MapPin, DollarSign, Clock, Star, Filter, Building, TrendingUp, CheckCircle } from 'lucide-react';

const BrowseJobsPage = () => {
  const { getToken } = useAuth();
  const [resume, setResume] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    jobType: '',
    minMatch: 0
  });

  // Fetch all jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = await getToken({ template: "default" });
      const response = await axios.get('http://localhost:5000/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document');
      return;
    }

    setResume(file);
    await analyzeResume(file);
  };

  const analyzeResume = async (file) => {
    setIsAnalyzing(true);
    try {
      const token = await getToken({ template: "default" });
      
      // Create FormData to send file
      const formData = new FormData();
      formData.append('resume', file);

      // Call backend API to analyze resume and match jobs
      const response = await axios.post(
        'http://localhost:5000/api/resume/analyze',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Response contains resume text and matched jobs with scores
      setResumeText(response.data.resumeText);
      setMatchedJobs(response.data.matchedJobs);
      setShowResults(true);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert(error.response?.data?.message || 'Failed to analyze resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getMatchLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Potential Match';
  };

  const filteredJobs = matchedJobs.filter(job => {
    const matchesLocation = !filters.location || 
      job.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesType = !filters.jobType || 
      job.job_type === filters.jobType;
    const matchesScore = job.matchScore >= filters.minMatch;
    
    return matchesLocation && matchesType && matchesScore;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Job Matching</h1>
          <p className="text-gray-600 mt-2">Upload your resume and let BERT AI find your perfect match</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Resume Upload Section */}
        {!showResults && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Upload Your Resume</h2>
              <p className="text-gray-600 mb-6">
                Our BERT-powered AI will analyze your skills, experience, and qualifications to match you with the most relevant job opportunities
              </p>
              
              <label className="inline-block">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isAnalyzing}
                />
                <div className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 inline-block shadow-lg">
                  {isAnalyzing ? 'Analyzing Resume...' : 'Choose Resume File'}
                </div>
              </label>
              
              {resume && !isAnalyzing && (
                <div className="mt-4 text-sm text-gray-600 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Selected: {resume.name}
                </div>
              )}
              
              {isAnalyzing && (
                <div className="mt-6">
                  <div className="inline-block w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse" style={{width: '70%'}}></div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-600 font-medium">🤖 Extracting resume content...</p>
                    <p className="text-sm text-gray-600 font-medium">🧠 BERT analyzing your skills...</p>
                    <p className="text-sm text-gray-600 font-medium">🎯 Matching with job postings...</p>
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">BERT Technology</h3>
                  </div>
                  <p className="text-sm text-gray-600">Advanced NLP model understands context and semantics</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Smart Matching</h3>
                  </div>
                  <p className="text-sm text-gray-600">Semantic similarity scoring for accurate results</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Real-time Results</h3>
                  </div>
                  <p className="text-sm text-gray-600">Get matched jobs instantly with confidence scores</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {showResults && (
          <>
            {/* Stats Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Jobs Analyzed</p>
                  <p className="text-3xl font-bold">{allJobs.length}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Matches Found</p>
                  <p className="text-3xl font-bold">{matchedJobs.length}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Top Match Score</p>
                  <p className="text-3xl font-bold">
                    {matchedJobs.length > 0 ? `${Math.round(matchedJobs[0].matchScore)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Refine Results
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFilters({ location: '', jobType: '', minMatch: 0 })}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setResume(null);
                      setMatchedJobs([]);
                    }}
                    className="text-sm px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    New Resume
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Remote, San Francisco"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={filters.jobType}
                    onChange={(e) => setFilters({...filters, jobType: e.target.value})}
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Match Score: {filters.minMatch}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={filters.minMatch}
                    onChange={(e) => setFilters({...filters, minMatch: parseInt(e.target.value)})}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Job Listings */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                {filteredJobs.length} {filteredJobs.length === 1 ? 'Job' : 'Jobs'} Matched to Your Profile
              </h3>

              {filteredJobs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <p className="text-gray-600 text-lg">No jobs match your current filters. Try adjusting them!</p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-l-4 border-blue-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getMatchColor(job.matchScore)}`}>
                            {Math.round(job.matchScore)}% Match
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {getMatchLabel(job.matchScore)}
                          </span>
                        </div>
                        <p className="text-lg text-gray-700 font-medium flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {job.company}
                        </p>
                      </div>
                      <Star className="w-6 h-6 text-gray-400 hover:text-yellow-500 cursor-pointer transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        {job.job_type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </div>
                      {job.salary_range && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          {job.salary_range}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        {formatDate(job.created_at)}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-3">{job.description}</p>

                    {job.requirements && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Requirements:</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{job.requirements}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Matched based on BERT semantic analysis
                      </div>
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseJobsPage;