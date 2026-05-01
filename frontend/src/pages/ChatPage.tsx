import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send, Plus, Paperclip, Smile, Sparkles } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { api, type ChatMessage } from "@/lib/api";

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prompts = [
    "Help me break my weight plateau",
    "Create a 7-day meal plan",
    "Best exercises for fat loss",
    "Explain my BMI reading",
    "Improve my sleep quality",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    setError("");
    try {
      const response = await api.getChatMessages();
      setMessages(response);
    } catch (err: any) {
      setError(err.message ?? "Unable to load chat");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError("");

    try {
      const response = await api.sendChatMessage({ content: trimmed });
      setMessages(response.messages);
      setInput("");
    } catch (err: any) {
      setError(err.message ?? "Unable to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = async () => {
    setError("");
    try {
      const response = await api.clearChatMessages();
      setMessages(response.messages);
      setInput("");
    } catch (err: any) {
      setError(err.message ?? "Unable to reset chat");
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <SidebarLayout className="p-0 h-screen overflow-hidden md:p-0">
      <div className="flex h-[calc(100vh-4rem)] md:h-screen w-full bg-background relative animate-in fade-in duration-500">
        <div className="hidden lg:flex w-72 border-r border-border bg-card flex-col">
          <div className="p-6 border-b border-border">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground py-3 rounded-xl font-bold shadow-sm transition-all"
            >
              <Plus className="w-5 h-5" /> New Chat
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 px-2">
              Suggested Prompts
            </h3>
            <div className="space-y-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="w-full text-left p-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <div className="h-16 px-6 border-b border-border bg-white flex items-center justify-between shrink-0 shadow-sm z-10 dark:bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-foreground leading-tight">LifeFit AI Coach</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {isLoading ? "Loading..." : "Local Ollama"}
                  </span>
                </div>
              </div>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-full border border-border">
              gemma4:e2b local
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading conversation...</div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mr-3 mt-1 shadow-sm">
                      AI
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] md:max-w-[70%] flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-white border border-border text-foreground rounded-bl-sm dark:bg-muted/50"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground mt-1.5 px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-border shrink-0 dark:bg-card">
            <div className="max-w-4xl mx-auto relative">
              <div className="flex items-end gap-2 bg-background border border-border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
                <button className="p-3 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your AI coach anything..."
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-[15px]"
                  rows={1}
                />

                <button className="p-3 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted shrink-0 hidden sm:block">
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                  className="p-3 bg-accent text-accent-foreground rounded-xl shrink-0 hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-3">
                <p className="text-[10px] text-muted-foreground font-medium">
                  LifeFit AI may make mistakes. Always consult a healthcare professional for medical advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
