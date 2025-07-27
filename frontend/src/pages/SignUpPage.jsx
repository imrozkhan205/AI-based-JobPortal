// pages/SignUpPage.jsx - Enhanced sign up page
import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex-1 bg-gradient-to-b from-blue-600 to-purple-600 text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🚀 AI based Job Portal</h1>
          <p className="text-lg opacity-90">Join thousands of professionals finding their next opportunity</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <SignUp 
            path="/sign-up" 
            routing="path"
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                card: "shadow-lg",
                headerTitle: "text-2xl font-bold",
                headerSubtitle: "text-gray-600"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}