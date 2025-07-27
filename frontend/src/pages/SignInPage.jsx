import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="flex ml-10  min-h-screen items-center justify-center ">
      <div className="w-full max-w-md">
        <div className="text-center mr-12 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>
        
        {/* Try the simplest possible SignIn component */}
        <SignIn
          afterSignInUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}