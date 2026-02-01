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
        <div className="flex justify-center items-center mt-20 pr-20">
          <img src={rocket} alt="" className="h-[80px] md:h-[120px] mb-4" />
          <h1 className="font-michroma text-3xl md:text-6xl font-bold mb-4">
            JobSpace
          </h1>
        </div>

        <p className="text-[16px] md:text-[18px] mb-6 mx-auto px-4 text-center max-w-2xl">
         JobSpace is an AI-powered hiring platform that understands resumes, not just keywords.
From ATS checks and resume insights to intelligent job matching, we help candidates stand out and teams find the right talent with confidence.
        </p> 

        <Link to="/sign-up">
          <button className="bg-white text-black text-opacity-80 px-6 py-3 rounded-2xl text-lg font-semibold shadow-lg hover:bg-gray-100">
            Get Started
          </button>
        </Link>
      </main>

      <div className="grid grid-cols-1 md:grid-cols-5 px-4 md:px-20 justify-center">
        <img src={resumeex} alt="resume-pic" className="size-[200px] md:size-[300px] mx-auto" />

        <img src={arrow} alt="" className="h-[50px] rotate-90 md:rotate-0 mx-auto my-4 md:my-0 md:mt-20 md:ml-10" />

        <img src={jsonex} alt="json-pic" className="size-[150px] md:size-[200px] mx-auto mt-4 md:mt-8 md:ml-9" />

        <img src={arrow} alt="" className="h-[50px] rotate-90 md:rotate-0 mx-auto my-4 md:my-0 px-10 md:mt-20" />

        <img src={listingex} alt="job-listings" className="size-[150px] md:size-[200px] mx-auto mt-4 md:mt-10 md:ml-10" />
      </div>
    </div>
  );
}
