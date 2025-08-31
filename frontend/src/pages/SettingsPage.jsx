import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

export default function SettingsPage() {
  const { getToken } = useAuth(); // ✅ correct way
  const [role, setRole] = useState("jobseeker");
  const [loading, setLoading] = useState(false);

  // Fetch current role from backend
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const token = await getToken({ template: "default" }); // get Clerk JWT
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRole(res.data.role);
      } catch (err) {
        console.error("Error fetching role:", err);
      }
    };
    fetchRole();
  }, [getToken]);

  const handleSwitchRole = async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "default" });
      const newRole = role === "jobseeker" ? "employer" : "jobseeker";

      await axios.put(
        "http://localhost:5000/api/users/role",
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRole(newRole);
    } catch (err) {
      console.error("Error switching role:", err);
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
