import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  MapPin, 
  DollarSign, 
  Briefcase, 
  FileText, 
  Building, 
  Calendar,
  Save,
  Eye,
  ArrowLeft
} from 'lucide-react';

const CreateJobPage = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    currency: 'USD',
    salary_range: '',
    job_type: 'full-time',
    requirements: '',
    benefits: '',
    posted_by: '' // This will be set from the logged-in user
  });
  const [errors, setErrors] = useState({});

  const jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' }
  ];

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
    { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
    { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
    { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
    { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
    { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
    { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
    { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
    { value: 'SGD', label: 'SGD - Singapore Dollar', symbol: 'S$' },
    { value: 'AED', label: 'AED - UAE Dirham', symbol: 'د.إ' }
  ];

  const getCurrencySymbol = (code) => currencies.find(c => c.value === code)?.symbol || '';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.description.trim()) newErrors.description = 'Job description is required';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.job_type) newErrors.job_type = 'Job type is required';
    
    // Validate salary range format if provided (numbers only; currency handled separately)
    if (formData.salary_range && !/^\d+(?:,\d{3})*(?:\s*-\s*\d+(?:,\d{3})*)?(?:\s*(?:per\s+)?(?:hour|year|month))?$/i.test(formData.salary_range.trim())) {
      newErrors.salary_range = 'Enter a valid range, e.g., 50,000 - 80,000 per year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const token = await getToken({ template: "default" });
      
      // Get current user info to set posted_by
      const userRes = await axios.get("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const jobData = {
        ...formData,
        posted_by: userRes.data.id // Use the user's database ID
      };

      const response = await axios.post(
        'http://localhost:5000/api/jobs',
        jobData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      // Success feedback
      alert('Job posted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        company: '',
        location: '',
        currency: 'USD',
        salary_range: '',
        job_type: 'full-time',
        requirements: '',
        benefits: '',
        posted_by: ''
      });
      
      // Optionally redirect to my-jobs page
      // navigate('/my-jobs');
      
    } catch (error) {
      console.error('Error creating job:', error);
      alert(error.response?.data?.message || 'Failed to create job posting');
    } finally {
      setLoading(false);
    }
  };

  const JobPreview = () => (
    <div className="bg-gray-800 border border-white-500/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Job Preview</h2>
        <button
          onClick={() => setShowPreview(false)}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white-400">{formData.title || 'Job Title'}</h1>
          <div className="flex items-center space-x-4 mt-2 text-gray-300">
            <span className="flex items-center">
              <Building size={16} className="mr-1" />
              {formData.company || 'Company Name'}
            </span>
            <span className="flex items-center">
              <MapPin size={16} className="mr-1" />
              {formData.location || 'Location'}
            </span>
            <span className="flex items-center">
              <Briefcase size={16} className="mr-1" />
              {jobTypes.find(type => type.value === formData.job_type)?.label || 'Full Time'}
            </span>
          </div>
          {formData.salary_range && (
            <div className="flex items-center mt-2">
              {/* <DollarSign size={16} className="mr-1 text-green-400" /> */}
              <span className="text-green-400 font-medium">{`${getCurrencySymbol(formData.currency)}${formData.salary_range}`}</span>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-white mb-2">Job Description</h3>
          <div className="text-gray-300 whitespace-pre-wrap">
            {formData.description || 'Job description will appear here...'}
          </div>
        </div>

        {formData.requirements && (
          <div>
            <h3 className="font-semibold text-white mb-2">Requirements</h3>
            <div className="text-gray-300 whitespace-pre-wrap">{formData.requirements}</div>
          </div>
        )}

        {formData.benefits && (
          <div>
            <h3 className="font-semibold text-white mb-2">Benefits</h3>
            <div className="text-gray-300 whitespace-pre-wrap">{formData.benefits}</div>
          </div>
        )}
      </div>
    </div>
  );

  if (showPreview) {
    return (
      <div className="p-6">
        <JobPreview />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Post a New Job</h1>
        <p className="text-gray-400">Fill in the details to create a job listing</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Title & Company */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Title *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-800 border ${
                  errors.title ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white-500`}
                placeholder="e.g. Senior Frontend Developer"
              />
            </div>
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Company Name *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-800 border ${
                  errors.company ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white-500`}
                placeholder="e.g. TechCorp Inc."
              />
            </div>
            {errors.company && <p className="text-red-400 text-sm mt-1">{errors.company}</p>}
          </div>
        </div>

        {/* Location & Job Type */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 bg-gray-800 border ${
                  errors.location ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white-500`}
                placeholder="e.g. San Francisco, CA or Remote"
              />
            </div>
            {errors.location && <p className="text-red-400 text-sm mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Type *
            </label>
            <select
              name="job_type"
              value={formData.job_type}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-gray-800 border ${
                errors.job_type ? 'border-red-500' : 'border-gray-700'
              } rounded-lg text-white focus:outline-none focus:border-white-500`}
            >
              {jobTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.job_type && <p className="text-red-400 text-sm mt-1">{errors.job_type}</p>}
          </div>
        </div>

        {/* Currency & Salary Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Compensation (Optional)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-1">
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-800 border ${
                  errors.currency ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white focus:outline-none focus:border-white-500`}
              >
                {currencies.map(curr => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative md:col-span-2">
              {/* <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} /> */}
              <span className="absolute left-9 top-3 text-gray-300">
                {getCurrencySymbol(formData.currency)}
              </span>
              <input
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleInputChange}
                className={`w-full pl-16 pr-4 py-3 bg-gray-800 border ${
                  errors.salary_range ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white-500`}
                placeholder="e.g. 60,000 - 90,000 per year"
              />
            </div>
          </div>
          {errors.salary_range && <p className="text-red-400 text-sm mt-1">{errors.salary_range}</p>}
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Job Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={6}
            className={`w-full px-4 py-3 bg-gray-800 border ${
              errors.description ? 'border-red-500' : 'border-gray-700'
            } rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white-500 resize-vertical`}
            placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Requirements (Optional)
          </label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white-500 resize-vertical"
            placeholder="• Bachelor's degree in Computer Science&#10;• 3+ years of React experience&#10;• Strong problem-solving skills"
          />
        </div>

        {/* Benefits */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Benefits (Optional)
          </label>
          <textarea
            name="benefits"
            value={formData.benefits}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white-500 resize-vertical"
            placeholder="• Health insurance&#10;• 401(k) matching&#10;• Flexible work hours&#10;• Remote work options"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
            disabled={!formData.title || !formData.description}
          >
            <Eye size={20} className="mr-2" />
            Preview Job
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-8 py-3 bg-white-600 hover:bg-white-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-medium flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Posting Job...
              </>
            ) : (
              <>
                <Save size={20} className="mr-2" />
                Post Job
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJobPage;