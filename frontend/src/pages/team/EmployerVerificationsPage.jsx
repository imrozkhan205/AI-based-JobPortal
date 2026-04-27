import { useEffect, useMemo, useState } from "react";
import { useAxios } from "../../lib/axios";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function EmployerVerificationsPage() {
  const api = useAxios();

  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [notesById, setNotesById] = useState({});
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [success, setSuccess] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    return qs.toString();
  }, [statusFilter]);

  const load = async () => {
    setLoading(true);
    setError(null);
    setSuccess("");
    try {
      const res = await api.get(`/employer-verification/requests?${query}`);
      setRequests(res.data.requests || []);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load requests";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const setNotes = (id, value) => {
    setNotesById((prev) => ({ ...prev, [id]: value }));
  };

  const review = async (id, status) => {
    setActionLoadingId(id);
    setError(null);
    setSuccess("");
    try {
      await api.patch(`/employer-verification/requests/${id}`, {
        status,
        notes: notesById[id] || "",
      });
      setSuccess(`Marked request #${id} as ${status}.`);
      await load();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to review request";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const sendTestEmail = async () => {
    setTestLoading(true);
    setError(null);
    setSuccess("");
    setTestResult(null);
    try {
      const res = await api.post("/employer-verification/test-email", {
        to: testTo || undefined,
      });
      setTestResult(res.data);
      setSuccess("Test email sent (or skipped). Check your inbox/spam.");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Test email failed";
      setError(msg);
      setTestResult(err.response?.data || null);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Employer Verification (Team)</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="mt-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="text-sm text-gray-300 mb-2">Email test</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:border-blue-500"
            placeholder="to@example.com (leave empty to send to your admin email)"
          />
          <button
            onClick={sendTestEmail}
            disabled={testLoading}
            className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testLoading ? "Sending..." : "Send test"}
          </button>
        </div>
        {testResult ? (
          <div className="mt-2 text-xs text-gray-400 break-words">
            Result: {JSON.stringify(testResult)}
          </div>
        ) : null}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-900/50 border border-green-500 rounded text-green-200 text-sm">
          {success}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {requests.length === 0 ? (
          <div className="text-gray-400">No requests found.</div>
        ) : (
          requests.map((r) => (
            <div key={r.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm text-gray-400">
                    Request #{r.id} • {formatDate(r.created_at)} •{" "}
                    <span className="text-blue-300 font-semibold">{r.status}</span>
                  </div>
                  <div className="mt-2 font-semibold">
                    {r.company_name} — {r.employer_name}
                  </div>
                  <div className="mt-2 text-sm text-gray-300 space-y-1">
                    <div>
                      <span className="text-gray-400">GSTIN:</span> {r.gstin}
                    </div>
                    <div>
                      <span className="text-gray-400">Office:</span> {r.office_address}
                    </div>
                    <div>
                      <span className="text-gray-400">Contact:</span> {r.contact_email}
                    </div>
                    {r.website ? (
                      <div>
                        <span className="text-gray-400">Website:</span> {r.website}
                      </div>
                    ) : null}
                    <div>
                      <span className="text-gray-400">User:</span> {r.user_email}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-96">
                  <label className="block text-sm text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={notesById[r.id] ?? r.notes ?? ""}
                    onChange={(e) => setNotes(r.id, e.target.value)}
                    className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:outline-none focus:border-blue-500"
                    rows={4}
                    placeholder="Reason / verification notes..."
                  />

                  {r.status === "pending" ? (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => review(r.id, "approved")}
                        disabled={actionLoadingId === r.id}
                        className="flex-1 px-4 py-2 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoadingId === r.id ? "..." : "Approve"}
                      </button>
                      <button
                        onClick={() => review(r.id, "rejected")}
                        disabled={actionLoadingId === r.id}
                        className="flex-1 px-4 py-2 bg-red-600 rounded hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoadingId === r.id ? "..." : "Reject"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-400">
                      Reviewed at: {formatDate(r.reviewed_at) || "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
