// pages/Dashboard.jsx - Enhanced dashboard with user info
import { useUser } from '@clerk/clerk-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.firstName || 'User'}!
          </h1>
          <p className="text-gray-600">
            Dashboard - Protected Content
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Profile</h3>
            <p className="text-blue-700">Manage your profile information</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">Resumes</h3>
            <p className="text-green-700">Create and manage your resumes</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Jobs</h3>
            <p className="text-purple-700">Browse and apply to jobs</p>
          </div>
        </div>
      </div>
    </div>
  );
}