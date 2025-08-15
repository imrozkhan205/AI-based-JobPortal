import { Routes, Route } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import { Home, Users, FileText, Settings, MessageCircle, Building2, LayoutDashboard as DashboardIcon } from 'lucide-react';
import { useState } from 'react';

import Dashboard from './pages/Dashboard';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import HomePage from './pages/Home';
import Sidebar from './components/Sidebar';

export default function App() {

  const [collapsed, setCollapsed] = useState(false);

  const navigationLinks = [
    { to: '/dashboard', icon: <DashboardIcon size={20} />, label: 'Dashboard' },
    { to: '/jobs', icon: <FileText size={20} />, label: 'Browse Jobs' },
    { to: '/applications', icon: <Users size={20} />, label: 'My Applications' },
    { to: '/companies', icon: <Building2 size={20} />, label: 'Companies' },
    { to: '/messages', icon: <MessageCircle size={20} />, label: 'Messages' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-black text-white -to-br from-blue-600 via-blue-400 to-blue-200">
      <SignedIn>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          links={navigationLinks}
        />
      </SignedIn>

      <div className={`transition-all duration-300 ${
        !['/', '/sign-in', '/sign-up'].includes(window.location.pathname)
          ? (collapsed ? 'ml-20' : 'ml-64')
          : ''
      }`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          <Route
            path="/dashboard"
            element={
              <SignedIn fallback={<div>Please sign in to access the dashboard</div>}>
                <Dashboard />
              </SignedIn>
            }
          />
          {/* other protected routes */}
        </Routes>
      </div>
    </div>
  );
}
