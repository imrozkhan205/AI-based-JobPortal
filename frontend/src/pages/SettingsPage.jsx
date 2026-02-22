import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useAxios } from "../lib/axios";

export default function SettingsPage({ onRoleChange }) {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const api = useAxios();
  const [role, setRole] = useState("jobseeker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState("");

  // Fetch current role from backend
  useEffect(() => {
    const fetchRole = async () => {
      try {
        setError(null);
        const res = await api.get("/users/me");
        setRole(res.data.role);
      } catch (err) {
        console.error("Error fetching role:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch current role";
        setError(errorMessage);
      }
    };
    fetchRole();
  }, []);

  useEffect(() => {
    if (!profileFile) {
      setProfilePreviewUrl(user?.imageUrl || "");
      return;
    }

    const objectUrl = URL.createObjectURL(profileFile);
    setProfilePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [profileFile, user?.imageUrl]);

  const handleSwitchRole = async () => {
    setLoading(true);
    setError(null);
    setSuccess("");
    try {
      const token = await getToken({ template: "default" });
      if (!token) {
        setError("Not signed in. Please sign in again.");
        return;
      }
      const newRole = role === "jobseeker" ? "employer" : "jobseeker";

      await api.put("/users/role", { role: newRole });

      setRole(newRole);
      setSuccess(`Role successfully changed to ${newRole}!`);

      // Inform parent (App) about role change so navigation updates immediately
      if (typeof onRoleChange === "function") {
        onRoleChange(newRole);
      }
    } catch (err) {
      const isNetworkError = !err.response && (err.message === "Network Error" || err.code === "ERR_NETWORK");
      const msg = isNetworkError
        ? "Can't reach the backend. (1) Start the backend: in the backend folder run 'npm run dev'. (2) Restart the frontend (stop and run 'npm run dev' again in the frontend folder) so the proxy is active."
        : (err.response?.data?.message || err.response?.data?.error || err.message || "Failed to switch role. Please try again.");
      setError(msg);
      console.error("Error switching role:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileFileChange = (event) => {
    setProfileError(null);
    setProfileSuccess("");

    const file = event.target.files?.[0];
    if (!file) {
      setProfileFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Please choose an image smaller than 5MB.");
      return;
    }

    setProfileFile(file);
  };

  const handleUpdateProfileImage = async () => {
    setProfileError(null);
    setProfileSuccess("");

    if (!isLoaded) {
      setProfileError("Profile is still loading. Please try again in a moment.");
      return;
    }

    if (!user) {
      setProfileError("Not signed in. Please sign in again.");
      return;
    }

    if (!profileFile) {
      setProfileError("Please select an image first.");
      return;
    }

    setProfileLoading(true);
    try {
      await user.setProfileImage({ file: profileFile });
      await user.reload();
      setProfileSuccess("Profile picture updated successfully.");
      setProfileFile(null);
    } catch (err) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        "Failed to update profile picture. Please try again.";
      setProfileError(msg);
    } finally {
      setProfileLoading(false);
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

      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <div className="mb-4">
          <p className="text-lg">Profile Picture</p>
          <p className="text-sm text-gray-400">
            Upload an image to use in JobSpace instead of your Gmail avatar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center text-xs text-gray-300">
            {profilePreviewUrl ? (
              <img
                src={profilePreviewUrl}
                alt="Profile preview"
                className="h-full w-full object-cover"
              />
            ) : (
              "No image"
            )}
          </div>

          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileFileChange}
              disabled={!isLoaded || profileLoading}
              className="block w-full text-sm text-gray-300 file:mr-4 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-500 disabled:opacity-50"
            />
            <p className="mt-2 text-xs text-gray-400">PNG or JPG up to 5MB.</p>
          </div>

          <button
            onClick={handleUpdateProfileImage}
            disabled={profileLoading || !profileFile}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {profileLoading ? "Saving..." : "Set Profile Picture"}
          </button>
        </div>

        {profileError && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded text-green-200 text-sm">
            {profileSuccess}
          </div>
        )}
      </div>

      {success && (
        <div className="mt-4 p-4 bg-green-900/50 border border-green-500 rounded-lg">
          <p className="text-green-200">{success}</p>
        </div>
      )}
    </div>
  );
}
