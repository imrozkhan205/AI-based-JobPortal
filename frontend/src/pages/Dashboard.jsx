import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProtectedData() {
      try {
        setLoading(true);
        const token = await getToken();
        
        console.log('Token retrieved:', token ? 'Token exists' : 'No token');
        console.log('Full token:', token);
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await axios.get("http://localhost:5000/api/protected", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        console.log('Success:', res.data);
        setData(res.data);
      } catch (err) {
        console.error('Error fetching protected data:', err);
        console.error('Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProtectedData();
  }, [getToken]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      {data && <p>{data.message}</p>}
    </div>
  );
}