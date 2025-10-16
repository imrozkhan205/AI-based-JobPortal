import { Routes, Route } from 'react-router-dom';
import { SignedIn, useUser, useAuth } from '@clerk/clerk-react';
import {
  Home, Users, FileText, Settings,
  MessageCircle, Building2, LayoutDashboard as DashboardIcon,
  Briefcase, Plus, BarChart3, UserCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

import Dashboard from './pages/Dashboard';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/Home';
import Sidebar from './components/Sidebar';
import SettingsPage from './pages/SettingsPage';

// Employer-specific pages
import CreateJobPage from './pages/employer/CreateJobPage';
import MyJobsPage from './pages/employer/MyJobsPage';

// Jobseeker-specific pages
import BrowseJobsPage from './pages/jobseeker/BrowseJobsPage.jsx';
import ApplicationsPage from './pages/jobseeker/ApplicationsPage';

// Common pages
import JobDetailPage from './pages/JobDetailPage';

// Role-specific Dashboard components
import JobseekerDashboard from './pages/JobseekerDashboard.jsx';
import EmployerDashboard from './pages/EmployerDashboard.jsx';

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();

  // Fetch user role from your backend
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isSignedIn) {
        setRoleLoading(false);
        return;
      }

      try {
        const token = await getToken({ template: "default" });
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(res.data.role);
        console.log("✅ User role fetched:", res.data.role);
      } catch (err) {
        console.error("Error fetching user role:", err);
        setUserRole('jobseeker'); // Default fallback
      } finally {
        setRoleLoading(false);
      }
    };

    fetchUserRole();
  }, [isSignedIn, getToken]);

  // Handle role change from SettingsPage
  const handleRoleChange = (newRole) => {
    setUserRole(newRole);
  };

  const jobseekerLinks = [
    { to: '/dashboard', icon: <DashboardIcon size={20} />, label: 'Dashboard' },
    { to: '/jobs', icon: <FileText size={20} />, label: 'Browse Jobs' },
    { to: '/applications', icon: <UserCheck size={20} />, label: 'My Applications' },
    { to: '/companies', icon: <Building2 size={20} />, label: 'Companies' },
    { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  const employerLinks = [
    { to: '/dashboard', icon: <DashboardIcon size={20} />, label: 'Dashboard' },
    { to: '/create-job', icon: <Plus size={20} />, label: 'Post Job' },
    { to: '/my-jobs', icon: <Briefcase size={20} />, label: 'My Jobs' },
    { to: '/applications', icon: <Users size={20} />, label: 'Applications' },
    { to: '/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
    { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  const navigationLinks = userRole === "employer" ? employerLinks : jobseekerLinks;

  return (
    <div className="min-h-screen bg-black text-white">
      <SignedIn>
        {!roleLoading && (
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            links={navigationLinks}
            userRole={userRole}
          />
        )}
      </SignedIn>

      <div className={`transition-all duration-300 ${!['/', '/sign-in', '/sign-up'].includes(window.location.pathname)
          ? (collapsed ? 'ml-20' : 'ml-64')
          : ''
        }`}>
        <Routes>
          {/* Common routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route
            path="/settings"
            element={<SettingsPage onRoleChange={handleRoleChange} />}
          />

          {/* Role-based Dashboard */}
          <Route
            path="/dashboard"
            element={
              <SignedIn fallback={<div>Please sign in to access the dashboard</div>}>
                {roleLoading ? (
                  <div className="flex items-center justify-center h-64 text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <span className="ml-3">Loading dashboard...</span>
                  </div>
                ) : userRole === 'employer' ? (
                  <EmployerDashboard />
                ) : (
                  <JobseekerDashboard />
                )}
              </SignedIn>
            }
          />

          {/* Jobseeker routes */}
          <Route
            path="/jobs"
            element={
              <SignedIn>
                {userRole === 'jobseeker' ? (
                  <BrowseJobsPage />
                ) : (
                  // Todo: Implement timeout
                  <div className="p-6 text-center"> 
                    <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
                    <p className="text-gray-400 mt-2">This page is for job seekers only</p>
                  </div>
                )}
              </SignedIn>
            }
          />

          {/* Individual Job Detail Route */}
          <Route
            path="/jobs/:id"
            element={
              <SignedIn>
                <JobDetailPage />
              </SignedIn>
            }
          />

          <Route
            path="/applications"
            element={
              <SignedIn>
                {userRole === 'jobseeker' ? (
                  <ApplicationsPage />
                ) : userRole === 'employer' ? (
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Candidate Applications</h1>
                    <p className="text-gray-400">Review applications for your job postings</p>
                    {/* This would be a different component for employers */}
                  </div>
                ) : null}
              </SignedIn>
            }
          />

          <Route
            path="/companies"
            element={
              <SignedIn>
                {userRole === 'jobseeker' ? (
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Companies</h1>
                    <p className="text-gray-400">Explore companies and their culture</p>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
                    <p className="text-gray-400 mt-2">This page is for job seekers only</p>
                  </div>
                )}
              </SignedIn>
            }
          />

          {/* Employer routes */}
          <Route
            path="/create-job"
            element={
              <SignedIn>
                {userRole === 'employer' ? (
                  <CreateJobPage />
                ) : (
                  <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
                    <p className="text-gray-400 mt-2">Only employers can post jobs</p>
                  </div>
                )}
              </SignedIn>
            }
          />

          <Route
            path="/my-jobs"
            element={
              <SignedIn>
                {userRole === 'employer' ? (
                  <MyJobsPage />
                ) : (
                  <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
                    <p className="text-gray-400 mt-2">Only employers can view this page</p>
                  </div>
                )}
              </SignedIn>
            }
          />

          <Route
            path="/analytics"
            element={
              <SignedIn>
                {userRole === 'employer' ? (
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                    <p className="text-gray-400">View your job posting performance and insights</p>
                    {/* Analytics component would go here */}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
                    <p className="text-gray-400 mt-2">Only employers can view analytics</p>
                  </div>
                )}
              </SignedIn>
            }
          />

          {/* Common routes */}
          <Route
            path="/messages"
            element={
              <SignedIn>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Messages</h1>
                  <p className="text-gray-400">
                    {userRole === 'employer'
                      ? 'Communicate with job candidates'
                      : 'Communicate with employers'
                    }
                  </p>
                </div>
              </SignedIn>
            }
          />
        </Routes>
      </div>
    </div>
  );
}