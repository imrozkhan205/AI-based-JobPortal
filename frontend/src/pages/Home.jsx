import { useAuth, UserButton } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import rocket from "../assets/rocket.png";
import resumeex from "../assets/resumeex.png";
import jsonex from "../assets/jsonex.png";
import listingex from "../assets/listingex.png";
import arrow from "../assets/arrow.png";

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect if signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate("/dashboard");
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 via-blue-400 to-blue-200 text-white px-4">
      
      {/* Header */}
      <header className="absolute">
        {isLoaded && isSignedIn && <UserButton />}
      </header>

      {/* Main Content */}
      <main className="text-center mb-20">
        <div className="flex justify-center items-center mt-20">
          <img src={rocket} alt="" className="h-[120px] mb-4" />
          <h1 className="font-michroma text-4xl md:text-6xl font-bold mb-4">
            AI based Job Portal
          </h1>
        </div>

        <p className="text-[18px] flex mb-6 ml-20 px-10">
          Which will help you find a job according to your skill by fetching
          your resume into a job pool.
        </p>
        <Link to="/sign-up">
          <button className="bg-white text-black text-opacity-80 px-6 py-3 rounded-2xl text-lg font-semibold shadow-lg hover:bg-gray-100">
            Get Started
          </button>
        </Link>
      </main>

      <div className="grid grid-cols-5 px-20 justify-center">
        <img src={resumeex} alt="resume-pic" className="size-[300px]" />

        <img src={arrow} alt="" className="h-[50px] mt-20 ml-10" />

        <img src={jsonex} alt="json-pic" className="size-[200px] mt-8 ml-9" />

        <img src={arrow} alt="" className="h-[50px] px-10 mt-20" />

        <img src={listingex} alt="job-listings" className="size-[200px] mt-10 ml-10" />
      </div>
    </div>
  );
}
