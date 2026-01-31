import { useState, useEffect, useRef } from "react";
import { useAxios } from "../lib/axios";
import { MessageCircle, Send } from "lucide-react";

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString();
}

export default function MessagesPage() {
  const api = useAxios();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setError(null);
        const res = await api.get("/messages/conversations");
        setConversations(res.data.conversations || []);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError(err.response?.data?.message || "Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selected) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${selected.applicationId}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setMessages([]);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selected?.applicationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !selected || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await api.post(`/messages/${selected.applicationId}`, { content: text });
      setMessages((prev) => [...prev, { ...res.data.message, isOwn: true }]);
    } catch (err) {
      console.error("Error sending message:", err);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const preview = (str, len = 40) =>
    str && str.length > len ? str.slice(0, len) + "…" : str || "No messages yet";

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MessageCircle size={28} />
        Messages
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-600 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <MessageCircle size={48} className="mb-3 opacity-50" />
          <p className="text-lg">No conversations yet</p>
          <p className="text-sm mt-1">
            {selected ? "" : "Apply to jobs (as a jobseeker) or receive applications (as an employer) to start chatting."}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 rounded-lg border border-gray-800 overflow-hidden bg-gray-900/50">
          {/* Conversation list */}
          <div className="w-80 border-r border-gray-800 flex flex-col shrink-0">
            <div className="p-2 border-b border-gray-800 bg-gray-900/80">
              <p className="text-sm text-gray-400 px-2">Conversations</p>
            </div>
            <div className="overflow-y-auto flex-1">
              {conversations.map((c) => (
                <button
                  key={c.applicationId}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-800/80 hover:bg-gray-800/50 transition ${
                    selected?.applicationId === c.applicationId ? "bg-gray-800" : ""
                  }`}
                >
                  <p className="font-medium text-white truncate">{c.otherPartyEmail}</p>
                  <p className="text-sm text-gray-500 truncate">{c.jobTitle} • {c.company}</p>
                  <p className="text-xs text-gray-600 truncate mt-0.5">
                    {preview(c.lastMessage)}
                  </p>
                  {c.lastMessageAt && (
                    <p className="text-xs text-gray-600 mt-0.5">{formatTime(c.lastMessageAt)}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {selected ? (
              <>
                <div className="p-3 border-b border-gray-800 bg-gray-900/80">
                  <p className="font-medium text-white">{selected.otherPartyEmail}</p>
                  <p className="text-sm text-gray-500">{selected.jobTitle} at {selected.company}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          m.isOwn
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-700 text-gray-100 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                        <p className={`text-xs mt-1 ${m.isOwn ? "text-blue-200" : "text-gray-400"}`}>
                          {formatTime(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-gray-800">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={5000}
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send size={18} />
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
