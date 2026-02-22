import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Award, TrendingUp, Mail, Phone, Linkedin, Briefcase, GraduationCap, Code, Target } from 'lucide-react';

const ATSChecker = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const analyzeResume = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('resume', file);
    if (jobDescription.trim()) {
      formData.append('jobDescription', jobDescription);
    }

    try {
      const response = await fetch('http://localhost:5000/api/ats/check', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to analyze resume');
      }

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.message || data.error || 'Failed to analyze resume');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to server. Make sure the backend is running.');
      console.error('Error analyzing resume:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setJobDescription('');
    setResults(null);
    setError(null);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-emerald-500/10 border border-emerald-500/20';
    if (score >= 75) return 'bg-blue-500/10 border border-blue-500/20';
    if (score >= 60) return 'bg-yellow-500/10 border border-yellow-500/20';
    return 'bg-red-500/10 border border-red-500/20';
  };

  const getStatusIcon = (status) => {
    if (status === 'good') return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (status === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatusColor = (status) => {
    if (status === 'good') return 'text-emerald-200 bg-emerald-500/10 border-emerald-500/30';
    if (status === 'warning') return 'text-yellow-200 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-200 bg-red-500/10 border-red-500/30';
  };

  const getRecommendationIcon = (type) => {
    if (type === 'critical') return <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />;
    if (type === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />;
    return <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-blue-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">ATS Resume Checker</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Analyze your resume's ATS compatibility and get actionable recommendations
          </p>
        </div>

        {!results ? (
          <div className="bg-gray-900/60 border border-gray-700 rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Upload Resume (PDF or DOCX)
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                  dragActive
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-gray-700 hover:border-blue-400 bg-gray-900/40'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-100 mb-2">
                    {file ? file.name : 'Drag and drop your resume here'}
                  </p>
                  <p className="text-sm text-gray-400">
                    or click to browse (Max 5MB)
                  </p>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Job Description (Optional)
              </label>
              <textarea
                className="w-full h-40 border-2 border-gray-700 bg-gray-900/60 rounded-xl p-4 text-gray-100 placeholder-gray-500 focus:border-blue-400 focus:outline-none transition-colors"
                rows="6"
                placeholder="Paste the job description here to see how well your resume matches..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start">
                <XCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={analyzeResume}
              disabled={!file || loading}
              className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all ${
                !file || loading
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-lg hover:shadow-xl'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing Resume...
                </span>
              ) : (
                'Analyze Resume'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-900/60 border border-gray-700 rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium text-gray-200 transition-colors border border-gray-700"
                >
                  Analyze Another
                </button>
              </div>

              <div className={`${getScoreBgColor(results.score)} rounded-2xl p-8 mb-8 text-center`}>
                <div className={`text-6xl font-bold ${getScoreColor(results.score)} mb-2`}>
                  {results.score}
                </div>
                <div className="text-xl font-semibold text-gray-200 mb-1">
                  {results.grade}
                </div>
                <div className="text-gray-400">ATS Compatibility Score</div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className={`border-2 rounded-xl p-6 ${getStatusColor(results.breakdown.format.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <FileText className="w-6 h-6 mr-2" />
                      <span className="font-semibold">Format</span>
                    </div>
                    {getStatusIcon(results.breakdown.format.status)}
                  </div>
                  <div className="text-2xl font-bold">
                    {results.breakdown.format.score}/{results.breakdown.format.max}
                  </div>
                </div>

                <div className={`border-2 rounded-xl p-6 ${getStatusColor(results.breakdown.contact.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Mail className="w-6 h-6 mr-2" />
                      <span className="font-semibold">Contact Info</span>
                    </div>
                    {getStatusIcon(results.breakdown.contact.status)}
                  </div>
                  <div className="text-2xl font-bold">
                    {results.breakdown.contact.score}/{results.breakdown.contact.max}
                  </div>
                </div>

                <div className={`border-2 rounded-xl p-6 ${getStatusColor(results.breakdown.sections.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Briefcase className="w-6 h-6 mr-2" />
                      <span className="font-semibold">Sections</span>
                    </div>
                    {getStatusIcon(results.breakdown.sections.status)}
                  </div>
                  <div className="text-2xl font-bold">
                    {results.breakdown.sections.score}/{results.breakdown.sections.max}
                  </div>
                </div>

                <div className={`border-2 rounded-xl p-6 ${getStatusColor(results.breakdown.keywords.status)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Code className="w-6 h-6 mr-2" />
                      <span className="font-semibold">Keywords</span>
                    </div>
                    {getStatusIcon(results.breakdown.keywords.status)}
                  </div>
                  <div className="text-2xl font-bold">
                    {results.breakdown.keywords.score}/{results.breakdown.keywords.max}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-400" />
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-200">
                      <Mail className="w-4 h-4 mr-2" />
                      Emails: {results.contactInfo.emails.length > 0 ? results.contactInfo.emails.join(', ') : 'None found'}
                    </div>
                    <div className="flex items-center text-gray-200">
                      <Phone className="w-4 h-4 mr-2" />
                      Phones: {results.contactInfo.phones.length > 0 ? results.contactInfo.phones.join(', ') : 'None found'}
                    </div>
                    <div className="flex items-center text-gray-200">
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn: {results.contactInfo.linkedin.length > 0 ? 'Found' : 'Not found'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Briefcase className="w-5 h-5 mr-2 text-blue-400" />
                    Resume Sections
                  </h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {Object.entries(results.sections).map(([section, present]) => (
                      <div
                        key={section}
                        className={`flex items-center p-3 rounded-lg ${
                          present ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30' : 'bg-red-500/10 text-red-200 border border-red-500/30'
                        }`}
                      >
                        {present ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        <span className="capitalize font-medium">{section}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Code className="w-5 h-5 mr-2 text-blue-400" />
                    Keywords Found ({results.keywordCount})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-500/15 text-blue-200 border border-blue-500/30 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {results.jobComparison && (
                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-400" />
                      Job Match Analysis
                    </h3>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-200 font-medium">Match Percentage</span>
                        <span className="text-2xl font-bold text-blue-400">
                          {results.jobComparison.matchPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${results.jobComparison.matchPercentage}%` }}
                        />
                      </div>
                    </div>
                    {results.jobComparison.missingKeywords.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-200 mb-2">
                          Missing Keywords:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {results.jobComparison.missingKeywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-red-500/15 text-red-200 border border-red-500/30 rounded-full text-sm font-medium"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {results.recommendations.length > 0 && (
                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                      Recommendations
                    </h3>
                    <div className="space-y-3">
                      {results.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-start p-4 bg-gray-900/60 rounded-lg border-2 border-gray-700"
                        >
                          {getRecommendationIcon(rec.type)}
                          <div className="ml-3">
                            <span className="text-xs font-semibold text-gray-400 uppercase">
                              {rec.category}
                            </span>
                            <p className="text-gray-200 mt-1">{rec.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSChecker;
