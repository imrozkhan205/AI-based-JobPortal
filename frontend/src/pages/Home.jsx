import { useAuth, UserButton } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import rocket from "../assets/rocket.png";
import resumeex from "../assets/resumeex.png";
import jsonex from "../assets/jsonex.png";
import listingex from "../assets/listingex.png";
import arrow from "../assets/arrow.png";
import jobSearching from "../assets/job-searching.jpg";

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
          <button className="bg-white border-gray-300 border-2 text-black text-opacity-80 px-6 py-3 rounded-2xl text-lg font-semibold shadow-lg hover:bg-gray-100">
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
      <section className="w-full max-w-6xl px-4 md:px-10 mb-16 pt-10">
        <div className="text-center mb-8">
          <h2 className="font-michroma text-2xl md:text-3xl font-semibold">
            How LLM Matching Works
          </h2>
          <p className="text-[14px] md:text-[16px] mt-3 text-white/90 max-w-3xl mx-auto">
            We use large language models to understand resumes and job descriptions at a deeper level,
            so matches are based on meaning, not just keywords.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg backdrop-blur">
            <h3 className="text-lg font-semibold mb-2">Semantic Resume Parsing</h3>
            <p className="text-[14px] text-white/90">
              The LLM extracts roles, skills, tools, and outcomes to build a structured profile of your experience.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg backdrop-blur">
            <h3 className="text-lg font-semibold mb-2">Context-Aware Ranking</h3>
            <p className="text-[14px] text-white/90">
              Jobs are ranked by how well they align with your domain, seniority, and impact—not just matching terms.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg backdrop-blur">
            <h3 className="text-lg font-semibold mb-2">Explainable Matches</h3>
            <p className="text-[14px] text-white/90">
              See why a role fits with highlights like skill overlap, required experience, and growth potential.
            </p>
          </div>
        </div>
        
      </section>

      <section className="w-full max-w-6xl px-4 md:px-10 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white/10 border border-white/20 rounded-3xl p-6 md:p-10 shadow-lg backdrop-blur">
          <img
            src={jobSearching}
            alt="People searching for jobs"
            className="w-full h-[240px] md:h-[320px] object-cover rounded-2xl shadow-md"
          />
          <div className="text-left">
            <h2 className="font-michroma text-2xl md:text-3xl font-semibold mb-3">
              Search Smarter, Apply Faster
            </h2>
            <p className="text-[14px] md:text-[16px] text-white/90 mb-4">
              Discover roles that actually fit your skills and goals. JobSpace
              understands your resume and surfaces opportunities with real
              signal, not just keyword overlap.
            </p>
            <p className="text-[14px] md:text-[16px] text-white/80">
              Save time, cut noise, and focus on openings that move your career
              forward.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
