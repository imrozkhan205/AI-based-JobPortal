import { SignedOut, SignedIn, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white px-4">
      <header className="absolute top-4 right-4">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <Link to="/sign-in">
            <button className="bg-white text-blue-600 px-4 py-2 rounded-md font-semibold shadow hover:bg-gray-100">
              Sign In
            </button>
          </Link>
        </SignedOut>
      </header>

      <main className="text-center mt-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">🚀 Resume Job Portal</h1>
        <p className="text-lg md:text-2xl mb-6 max-w-xl">
          Find the best job openings matched to your resume using AI.
        </p>
        <SignedOut>
          <Link to="/sign-up">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-md text-lg font-semibold shadow hover:bg-gray-100">
              Get Started
            </button>
          </Link>
        </SignedOut>
        <SignedIn>
          <Link to="/dashboard">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-md text-lg font-semibold shadow hover:bg-gray-100">
              Go to Dashboard
            </button>
          </Link>
        </SignedIn>
      </main>
    </div>
  );
}
