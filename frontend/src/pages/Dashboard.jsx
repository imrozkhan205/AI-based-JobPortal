import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../lib/axios";

export default function Dashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    async function syncUser() {
      try {
        if (!user) return;

        const token = await getToken();

        await axios.post(
          `${API_BASE_URL}/api/auth/sync-user`,
          {
            clerkId: user.id,
            email: user.primaryEmailAddress.emailAddress,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error("Error syncing user:", err);
      }
    }

    syncUser();
  }, [user, getToken]);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.fullName || user?.username || user?.id}</p>
    </div>
  );
}
