import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, MessageSquare, AlertCircle, RefreshCw, Globe2 } from "lucide-react";
import { Conversation, Message, KnowledgeArticle, Language, TRANSLATIONS } from "../types";

interface ChatWidgetProps {
  language: Language;
  currentConversation: Conversation | null;
  knowledgeBase: KnowledgeArticle[];
  securityMasking: boolean;
  aiTone: "polite" | "concise" | "formal";
  aiTemperature: number;
  onUpdateConversation: (conv: Conversation) => void;
  onAddNewConversation: (conv: Conversation) => void;
}

export default function ChatWidget({
  language,
  currentConversation,
  knowledgeBase,
  securityMasking,
  aiTone,
  aiTemperature,
  onUpdateConversation,
  onAddNewConversation,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[language];

  // Auto-fill test visitor details if empty, for rapid testing
  useEffect(() => {
    if (!userName) {
      setUserName("Jan Kowalski");
      setUserEmail("jan.kowalski@firmeX.pl");
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentConversation?.messages, loading]);

  // Sensitive data masker (client-side backup for security demonstration)
  const applySensitiveDataMasking = (text: string): string => {
    if (!securityMasking) return text;
    // Mask emails
    let masked = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[MASKED_EMAIL]");
    // Mask Polish-style phone numbers (9 digits grouped or single)
    masked = masked.replace(/(?:\+\d{2}\s?)?\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g, "[MASKED_PHONE]");
    // Mask common banking account/credit card pattern (16 digits or 26 IBAN digits partially)
    masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[MASKED_CARD]");
    return masked;
  };

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    // Create new simulated conversation
    const newConv: Conversation = {
      id: "conv_" + Math.random().toString(36).substr(2, 9),
      userName: userName,
      userEmail: applySensitiveDataMasking(userEmail),
      status: "active_bot",
      urgency: "low",
      messages: [
        {
          id: "g_1",
          sender: "bot",
          text: t.botGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    onAddNewConversation(newConv);
    setIsJoined(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentConversation || loading) return;

    const userRawText = inputValue;
    const userText = applySensitiveDataMasking(userRawText);
    setInputValue("");

    // 1. Instantly append User Message to UI
    const updatedMessages: Message[] = [
      ...currentConversation.messages,
      {
        id: "msg_" + Math.random().toString(36).substr(2, 9),
        sender: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    const interimConv: Conversation = {
      ...currentConversation,
      messages: updatedMessages,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateConversation(interimConv);

    // If chat status is active_agent (human), bot does not reply automatically, but we can evaluate urgency in background
    if (currentConversation.status === "active_agent") {
      // In agent mode, we simply let the human reply in the dashboard.
      // But we can analyze client message in background to keep recommendations updated.
      setLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            history: updatedMessages.map(m => ({
              sender: m.sender,
              text: m.text
            })),
            knowledgeBase: knowledgeBase,
            aiTone: aiTone,
            aiTemperature: aiTemperature,
          }),
        });
        const aiAnalysis = await response.json();
        
        onUpdateConversation({
          ...interimConv,
          urgency: aiAnalysis.urgency || interimConv.urgency,
          urgencyReason: aiAnalysis.urgencyReason || interimConv.urgencyReason,
          category: aiAnalysis.category || interimConv.category,
          sentiment: aiAnalysis.sentiment || interimConv.sentiment,
          suggestions: aiAnalysis.suggestions || interimConv.suggestions,
        });
      } catch (err) {
        console.error("Agent assistant evaluation failed:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2. Query server-side Gemini API (Bot handles conversation)
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: updatedMessages.map(m => ({
            sender: m.sender,
            text: m.text
          })),
          knowledgeBase: knowledgeBase,
          aiTone: aiTone,
          aiTemperature: aiTemperature,
        }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const botReply = await response.json();

      // Append Bot Reply and update classification info
      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          id: "bot_msg_" + Math.random().toString(36).substr(2, 9),
          sender: "bot",
          text: botReply.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];

      onUpdateConversation({
        ...interimConv,
        messages: finalMessages,
        urgency: botReply.urgency || "low",
        urgencyReason: botReply.urgencyReason,
        category: botReply.category,
        sentiment: botReply.sentiment,
        suggestions: botReply.suggestions,
        insufficientInfo: !!botReply.insufficientInfo,
        lastUpdated: new Date().toISOString(),
      });

    } catch (err) {
      console.error("AI chatbot error:", err);
      // Fallback message
      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          id: "fallback_bot_" + Math.random().toString(36).substr(2, 9),
          sender: "bot",
          text: language === "pl" 
            ? "Mamy teraz małe utrudnienia techniczne. Przekierowuję Cię na czat z doradcą." 
            : "We are experiencing a temporary network issue. Transferring you to our support agent.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      onUpdateConversation({
        ...interimConv,
        status: "active_agent",
        messages: finalMessages,
        urgency: "medium",
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const currentConversationsForUser = currentConversation;

  return (
    <>
      {/* Floating Toggle Icon */}
      <button
        id="chat-toggle-widget"
        onClick={() => {
          setIsOpen(!isOpen);
          // If no conversation yet, reset state
          if (!currentConversation) {
            setIsJoined(false);
          } else {
            setIsJoined(true);
          }
        }}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-xl z-50 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 duration-200 cursor-pointer border border-[#4f46e5]/45"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="text-sm font-medium tracking-wide pr-1 hidden md:inline">
          {isOpen ? "Zamknij" : t.clientChatWidget}
        </span>
      </button>

      {/* Widget Container */}
      {isOpen && (
        <div 
          id="chat-widget-body"
          className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-[#16191f] border border-white/5 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-950 to-[#0a0b0d] p-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-indigo-400 border-2 border-[#16191f] rounded-full"></span>
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm tracking-wide font-sans">AI Assistant</h4>
                <p className="text-xs text-indigo-400 flex items-center gap-1">
                  {currentConversation?.status === "active_agent" ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                      {language === "pl" ? "Konsultant Rzeczywisty" : "Live Human Agent"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                      {language === "pl" ? "Sztuczna Inteligencja" : "Powered by AI"}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Urgency tag for testing visibility in client view */}
            {isJoined && currentConversation && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border hidden sm:inline ${
                currentConversation.urgency === "critical" ? "bg-red-950/80 text-red-300 border-red-500/40 animate-pulse" :
                currentConversation.urgency === "high" ? "bg-orange-950/80 text-orange-300 border-orange-500/40" :
                currentConversation.urgency === "medium" ? "bg-amber-950/80 text-amber-300 border-amber-500/40" :
                "bg-white/5 text-slate-300 border-white/5"
              }`}>
                {language === "pl" ? "Priorytet: " : "Priority: "}
                {currentConversation.urgency.toUpperCase()}
              </span>
            )}
          </div>

          {/* Body */}
          {!isJoined ? (
            /* Setup State */
            <div className="flex-1 p-6 flex flex-col justify-center bg-[#0a0b0d]">
              <div className="text-center mb-6">
                <h5 className="text-white font-medium text-lg mb-2">
                  {language === "pl" ? "Przetestuj widget u klienta" : "Test client chat module"}
                </h5>
                <p className="text-gray-400 text-xs font-sans">
                  {language === "pl" 
                    ? "Wpisz swoje dane, aby zasymulować nową rozmowę klienta z inteligentnym botem." 
                    : "Fill out customer details to simulate a live customer session with the automated agent."}
                </p>
              </div>

              <form onSubmit={handleStartChat} className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-medium font-sans">
                    {language === "pl" ? "Imię i nazwisko" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-gray-500 focus:outline-none focus:border-indigo-505 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-xs mb-1 font-medium font-sans">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="e.g. support@enterprise.com"
                    className="w-full bg-[#0f1115] border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-gray-500 focus:outline-none focus:border-indigo-505 font-sans"
                  />
                  {securityMasking && (
                    <span className="text-[10px] text-indigo-400 mt-1 block font-mono">
                      🛡️ {language === "pl" ? "Zabezpieczenie danych RODO aktywne" : "GDPR live masking turned on"}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-semibold transition-colors mt-2 cursor-pointer shadow-lg font-sans"
                >
                  {language === "pl" ? "Rozpocznij czat" : "Begin Chat"}
                </button>
              </form>
            </div>
          ) : (
            /* Chat messages */
            <div className="flex-1 flex flex-col overflow-hidden bg-[#0c0d10]">
              {/* Message flow */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentConversation?.messages.map((msg, i) => {
                  const isBot = msg.sender === "bot";
                  const isAgent = msg.sender === "agent";
                  const isUser = msg.sender === "user";

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Avatar */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                          isUser ? "bg-[#16191f] text-slate-200 border border-white/5" :
                          isAgent ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" :
                          "bg-indigo-500/20 text-indigo-300 border border-[#4f46e5]/30"
                        }`}>
                          {isUser ? <User className="w-3" /> : <Bot className="w-3" />}
                        </div>

                        {/* Text bubble */}
                        <div>
                          <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed shadow-sm font-sans ${
                            isUser ? "bg-indigo-600 text-white rounded-tr-none" :
                            isAgent ? "bg-[#16191f] text-orange-200 border border-orange-950/30 rounded-tl-none font-sans" :
                            "bg-[#16191f] text-slate-100 border border-white/5 rounded-tl-none font-sans"
                          }`}>
                            {msg.text}
                          </div>
                          
                          <span className="text-[9px] text-gray-500 block mt-1 px-1 font-sans">
                            {isAgent ? `${language === "pl" ? "Agent" : "Agent"} • ` : isBot ? "AI Assistant • " : ""}
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 items-center text-gray-400 bg-[#16191f] border border-white/5 rounded-xl px-3 py-2 text-xs font-sans">
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                      <span>AI {language === "pl" ? "analizuje i generuje..." : "thinking..."}</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-[#0a0b0d] flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t.typeProblemHere}
                  disabled={loading}
                  className="flex-1 bg-[#16191f] border border-white/5 rounded-lg py-1.5 px-3 text-xs text-slate-100 placeholder-gray-500 focus:outline-none focus:border-indigo-505 font-sans"
                />
                <button
                  type="submit"
                  disabled={loading || !inputValue.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#16191f] text-white rounded-lg p-2 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
