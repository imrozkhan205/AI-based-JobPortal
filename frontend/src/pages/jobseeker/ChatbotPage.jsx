import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import {
  Bot,
  Send,
  Upload,
  AlertCircle,
  FileText,
  Loader2,
  Info,
} from "lucide-react";

const allowedFileTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ChatbotPage = () => {
  const { getToken, userId, isLoaded } = useAuth();
  const initialMessages = [
    {
      role: "bot",
      text:
        "Hi, I'm your Job Preparation Assistant. I can help only with:\n" +
        "• Aptitude (quant, logical reasoning, puzzles)\n" +
        "• Interview preparation (HR + technical)\n" +
        "• Job preparation (resume, applications, placements)\n" +
        "• Top companies for different roles\n" +
        "• Skill-based learning paths / roadmaps\n\n" +
        "You can also upload a resume or job description, and then ask questions like:\n" +
        "“What skills am I missing for data analyst roles?” or “How should I prepare for interviews for these companies?”",
    },
  ];
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const loadedFromStorageRef = useRef(false);

  const storageKey = `career_chatbot_history:${userId || "guest"}`;

  useEffect(() => {
    if (!isLoaded || loadedFromStorageRef.current) return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        loadedFromStorageRef.current = true;
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        loadedFromStorageRef.current = true;
        return;
      }

      const sanitized = parsed
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "bot") &&
            typeof m.text === "string"
        )
        .map((m) => ({
          role: m.role,
          text: m.text,
          ...(typeof m.fileName === "string" ? { fileName: m.fileName } : {}),
        }));

      setMessages(sanitized.length ? sanitized : initialMessages);
    } catch {
      setMessages(initialMessages);
    } finally {
      loadedFromStorageRef.current = true;
    }
  }, [isLoaded, storageKey]);

  useEffect(() => {
    if (!loadedFromStorageRef.current) return;

    try {
      const toSave = messages.slice(-200); // prevent unbounded localStorage growth
      localStorage.setItem(storageKey, JSON.stringify(toSave));
    } catch {
      // ignore storage failures (private mode, quota exceeded, etc.)
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleClearChat = () => {
    setMessages(initialMessages);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!allowedFileTypes.includes(selected.type)) {
      setError(
        "Invalid file type. Only PDF and Word (doc/docx) documents are allowed."
      );
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("File too large. Max 5MB allowed.");
      setFile(null);
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleSend = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setError("");
    setIsSending(true);

    const newUserMessage = { role: "user", text: trimmed, fileName: file?.name };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");

    try {
      const token = await getToken({ template: "default" });
      const formData = new FormData();
      formData.append("message", trimmed);
      if (file) {
        formData.append("document", file);
      }

      const res = await axios.post(
        "http://localhost:5000/api/chatbot/ask",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const botText = res.data.answer;
      const metaInfo = [];
      if (res.data.topicCategory) {
        metaInfo.push(
          `Topic: ${res.data.topicCategory.replace("_", " ")}`
        );
      }
      if (res.data.usedDocument && res.data.fileName) {
        metaInfo.push(`Used document: ${res.data.fileName}`);
      }

      const metaLine = metaInfo.length ? `\n\n(${metaInfo.join(" • ")})` : "";

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: (botText || "").trim() + metaLine },
      ]);
    } catch (err) {
      console.error("Chatbot error:", err);
      const backendMessage =
        err.response?.data?.message ||
        "Something went wrong while contacting the chatbot. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            "I couldn't process that request right now.\n\n" +
            backendMessage,
        },
      ]);
    } finally {
      setIsSending(false);
      // Do not auto-clear the file so user can reuse it across multiple questions
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col p-4 md:p-6">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] bg-gray-950/80 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-800 bg-gradient-to-r from-indigo-700/30 via-purple-700/20 to-gray-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold">
                Jobseeker Career Chatbot
              </h1>
              <p className="text-xs md:text-sm text-gray-300">
                Only for aptitude, interview, job prep, top companies & skill
                roadmaps.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearChat}
            className="text-xs md:text-sm px-3 py-2 rounded-xl bg-gray-900/70 border border-gray-700 hover:border-indigo-500 hover:bg-gray-900 text-gray-200 transition-colors"
          >
            Clear chat
          </button>
        </div>

        {/* Info banner */}
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-900/80 text-xs md:text-sm text-gray-300 flex gap-2">
          <Info className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
          <div>
            Ask questions like:
            <span className="text-gray-200">
              {" "}
              “How do I prepare aptitude for product companies?”, “Roadmap to
              become a backend developer”, “How to prepare for SDE interviews
              at top companies?”
            </span>{" "}
            You can upload your resume or a job description to get more
            tailored guidance.
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 space-y-3 bg-gradient-to-b from-gray-900 via-gray-950 to-black">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm md:text-[0.95rem] leading-relaxed shadow-md ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700/70"
                }`}
              >
                {msg.fileName && (
                  <div className="mb-1 flex items-center text-xs text-indigo-100/80">
                    <FileText className="w-3 h-3 mr-1" />
                    <span>{msg.fileName}</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-2 text-sm flex items-center gap-2 text-gray-300 border border-gray-700/70">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-5 py-2 bg-red-900/40 border-t border-red-700/70 text-xs md:text-sm text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Input area */}
        <form
          onSubmit={handleSend}
          className="px-4 md:px-5 py-3 border-t border-gray-800 bg-gray-950/95 flex flex-col gap-2"
        >
          {/* File row */}
          <div className="flex items-center justify-between gap-3 text-xs md:text-sm">
            <label className="inline-flex items-center gap-2 cursor-pointer text-gray-200">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-800 border border-gray-700 hover:border-indigo-500 transition-colors">
                <Upload className="w-4 h-4 text-indigo-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">
                  {file ? "Change document" : "Attach document (optional)"}
                </span>
                <span className="text-[0.7rem] text-gray-400">
                  PDF / DOC / DOCX • Max 5MB
                </span>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {file && (
              <div className="flex items-center gap-2 text-[0.75rem] text-gray-300 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                <FileText className="w-3 h-3 text-indigo-300" />
                <span className="truncate max-w-[180px]">{file.name}</span>
              </div>
            )}
          </div>

          {/* Text + send row */}
          <div className="flex items-center gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your question about aptitude, interview prep, top companies, or skill roadmap..."
              className="flex-1 resize-none rounded-xl bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 px-3 py-2 text-sm md:text-[0.95rem] text-white placeholder-gray-500 outline-none max-h-32"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-indigo-800/40 transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPage;

