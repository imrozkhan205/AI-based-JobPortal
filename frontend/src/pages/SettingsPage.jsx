import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useAxios } from "../lib/axios";

export default function SettingsPage({ onRoleChange }) {
  const { getToken } = useAuth();
  const api = useAxios();
  const [role, setRole] = useState("jobseeker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch current role from backend
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await api.get("/users/me");
        setRole(res.data.role);
      } catch (err) {
        console.error("Error fetching role:", err);
      }
    };
    fetchRole();
  }, []);

  const handleSwitchRole = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: "default" });
      if (!token) {
        setError("Not signed in. Please sign in again.");
        return;
      }
      const newRole = role === "jobseeker" ? "employer" : "jobseeker";

      await api.put("/users/role", { role: newRole });

      setRole(newRole);
      onRoleChange?.(newRole);
      window.location.reload();
    } catch (err) {
      const isNetworkError = !err.response && (err.message === "Network Error" || err.code === "ERR_NETWORK");
      const msg = isNetworkError
        ? "Can't reach the backend. (1) Start the backend: in the backend folder run 'npm run dev'. (2) Restart the frontend (stop and run 'npm run dev' again in the frontend folder) so the proxy is active."
        : (err.response?.data?.message || err.message || "Failed to switch role");
      setError(msg);
      console.error("Error switching role:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
        <div>
          <p className="text-lg">Current Role:</p>
          <p className="text-blue-400 font-semibold">{role}</p>
        </div>
        <button
          onClick={handleSwitchRole}

          disabled={loading}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Switching..." : "Switch Role"}
        </button>
      </div>
    </div>
  );
}
