import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

export default function SettingsPage({ onRoleChange }) {
  const { getToken } = useAuth(); // ✅ correct way
  const [role, setRole] = useState("jobseeker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current role from backend
  useEffect(() => {
    const fetchRole = async () => {
      try {
        setError("");
        const token = await getToken({ template: "default" }); // get Clerk JWT
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRole(res.data.role);
      } catch (err) {
        console.error("Error fetching role:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch current role";
        setError(errorMessage);
      }
    };
    fetchRole();
  }, [getToken]);

  const handleSwitchRole = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const token = await getToken({ template: "default" });
      const newRole = role === "jobseeker" ? "employer" : "jobseeker";

      await axios.put(
        "http://localhost:5000/api/users/role",
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRole(newRole);
      setSuccess(`Role successfully changed to ${newRole}!`);

      // Inform parent (App) about role change so navigation updates immediately
      if (typeof onRoleChange === "function") {
        onRoleChange(newRole);
      }
    } catch (err) {
      console.error("Error switching role:", err);
      console.error("Full error:", err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to switch role. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
        <div>
          <p className="text-lg">Current Role:</p>
          <p className="text-blue-400 font-semibold capitalize">{role}</p>
        </div>
        <button
          onClick={handleSwitchRole}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Switching..." : "Switch Role"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-900/50 border border-green-500 rounded-lg">
          <p className="text-green-200">{success}</p>
        </div>
      )}
    </div>
  );
}
