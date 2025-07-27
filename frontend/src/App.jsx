import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/dashboard" element={
          <SignedIn>
            <Dashboard />
          </SignedIn>
        }/>
      </Routes>
    </BrowserRouter>
  );
}
