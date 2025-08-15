// pages/SignUpPage.jsx - Enhanced sign up page
import { SignUp } from '@clerk/clerk-react';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen  ">
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