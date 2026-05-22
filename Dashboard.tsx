import React, { useState } from "react";
import { 
  MessageSquare, 
  BookOpen, 
  Shield, 
  Bot, 
  Sparkles, 
  Languages, 
  HelpCircle,
  LayoutDashboard,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Conversation, KnowledgeArticle, SecurityConfig, Language, TRANSLATIONS } from "./types";
import Dashboard from "./components/Dashboard";
import LiveChat from "./components/LiveChat";
import KnowledgeBase from "./components/KnowledgeBase";
import SecurityConsole from "./components/SecurityConsole";
import ChatWidget from "./components/ChatWidget";

// Initial seed articles for the enterprise knowledge base
const SEED_ARTICLES: KnowledgeArticle[] = [
  {
    id: "art_password",
    category: "Konta i Bezpieczeństwo",
    title: "Resetowanie i zmiana hasła dostępu",
    content: "Aby zresetować hasło, przejdź do strony logowania i kliknij link 'Nie pamiętam hasła' lub przejdź bezpośrednio do strony /reset-hasla. Następnie wpisz swój firmowy adres e-mail. Po otrzymaniu bezpiecznego tokenu na skrzynkę e-mail, wpisz nowe hasło (minimum 10 znaków, w tym jedna cyfra i znak specjalny).",
    lastUpdated: "2026-05-18",
  },
  {
    id: "art_pricing",
    category: "Finanse i Rozliczenia",
    title: "Cennik pakietów biznesowych oraz limity",
    content: "Możesz wybrać jeden z trzech planów rocznych lub miesięcznych:\n1. Plan Starter: 99 PLN/miesięcznie (wsparcie do 2 agentów, podstawowy bot AI, 100 czatów/miesięcznie).\n2. Plan Pro: 249 PLN/miesięcznie (wsparcie do 10 agentów, pełna asysta bazy wiedzy, nielimitowane rozmowy, pełny moduł raportów).\n3. Plan Enterprise: wycena indywidualna (dedykowany SLA, bazy danych w Polsce, dedykowany model Llama/Gemini).",
    lastUpdated: "2026-05-20",
  },
  {
    id: "art_refunds",
    category: "Finanse i Rozliczenia",
    title: "Procedura zwrotów i zgłaszania reklamacji",
    content: "Zwroty środków za niewykorzystany okres subskrypcji są akceptowane w terminie do 14 dni od zakupu zgodnie z RODO i polskim prawem konsumenckim. Wyślij e-mail z uzasadnieniem na adres reklamacje@twojafirma.pl. Po rozpatrzeniu zgłoszenia (średnio 2-3 dni robocze) kwota zostanie odesłana metodą, którą dokonano płatności.",
    lastUpdated: "2026-05-21",
  }
];

// Initial seed conversations showing standard help queries
const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_tech_help",
    userName: "Adam Nowak",
    userEmail: "adam.nowak@firmex.pl",
    status: "active_agent",
    urgency: "high",
    urgencyReason: "Zgłoszenie awarii blokującej transakcję zakupu u klienta biznesowego.",
    category: "Pomoc techniczna",
    sentiment: "negative",
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Dzień dobry, mam błąd podczas wysyłania formularza dostawy. Cały ekran się zamraża i nie wyświetla podsumowania.",
        timestamp: "10:15",
      },
      {
        id: "m2",
        sender: "bot",
        text: "Cześć! Przeanalizowałem Twój problem techniczny. Całkowite zamrożenie formularza zazwyczaj oznacza niepoprawne załadowanie tokenu sesji. Proponuję spróbować odświeżyć stronę lub wyczyścić ciasteczka.",
        timestamp: "10:16",
      },
      {
        id: "m3",
        sender: "user",
        text: "Niestety po odświeżeniu i wyczyszczeniu ciasteczek nadal mam ten błąd. Ekran kompletnie nie działa, a muszę pilnie zapłacić za zamówienie!",
        timestamp: "10:20",
      }
    ],
    suggestions: [
      "Prześlij bezpośredni awaryjny link do płatności online",
      "Poproś o zrzut ekranu z konsoli deweloperskiej (F12)",
      "Przeprowadź natychmiastową weryfikację logów transakcyjnych"
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "conv_pricing_query",
    userName: "Anna Kowalska",
    userEmail: "anna@kowalska-biuro.pl",
    status: "active_bot",
    urgency: "medium",
    urgencyReason: "Zapytanie o koszty i specyfikację pakietu biznesowego Pro.",
    category: "Finanse i Rozliczenia",
    sentiment: "positive",
    messages: [
      {
        id: "c1",
        sender: "user",
        text: "Chciałam zapytać, ile kosztuje pakiet Pro dla 5 użytkowników i czy dostanę fakturę?",
        timestamp: "11:42",
      },
      {
        id: "c2",
        sender: "bot",
        text: "Dzień dobry! Zgadzam się chętnie z pomocą. Pakiet Pro kosztuje 249 PLN/miesięcznie, obsługuje do 10 agentów (więc 5 użytkowników mieści się w pakiecie z zapasem) i oczywiście wystawiamy pełną fakturę VAT.",
        timestamp: "11:43",
      },
      {
        id: "c3",
        sender: "user",
        text: "Super! A czy w planie Pro mam też zaawansowany panel analityki rozmów i wsparcie RODO?",
        timestamp: "11:45",
      }
    ],
    suggestions: [
      "Potwierdź obecność pełnego modułu analitycznego i logów RODO w pakiecie Pro",
      "Zaoferuj pomoc przy natychmiastowym wdrożeniu i darmowe 14 dni testowe",
      "Zaproponuj wysłanie kompletnej oferty PDF na adres anna@kowalska-biuro.pl"
    ],
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "conv_resolved_pass",
    userName: "Piotr Wiśniewski",
    userEmail: "piotr.w@gmail.com",
    status: "solved",
    urgency: "low",
    urgencyReason: "Zgłoszenie resetu hasła rozwiązane pomyślnie z pomocą bazy wiedzy.",
    category: "Konta i Bezpieczeństwo",
    sentiment: "positive",
    messages: [
      {
        id: "p1",
        sender: "user",
        text: "Cześć, zapomniałem hasła i nie mogę się zalogować. Gdzie znajdę link do resetu?",
        timestamp: "09:02",
      },
      {
        id: "p2",
        sender: "bot",
        text: "Cześć! Link do resetu hasła znajdziesz bezpośrednio pod adresem /reset-hasla lub klikając opcję 'Nie pamiętam hasła' na ekranie głównym. Wpisz swój e-mail, a wyślemy instrukcję.",
        timestamp: "09:03",
      },
      {
        id: "p3",
        sender: "user",
        text: "Dzięki wielkie, logowanie działa!",
        timestamp: "09:05",
      }
    ],
    suggestions: [],
    lastUpdated: new Date().toISOString(),
  }
];

export default function App() {
  const [language, setLanguage] = useState<Language>("pl");
  const [activeTab, setActiveTab] = useState<"dashboard" | "livechat" | "knowledge" | "security">("dashboard");
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeArticle[]>(SEED_ARTICLES);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    dataMaskingEnabled: true,
    autoPIICleanup: false,
    retentionDays: 30,
    sessionTimeoutMinutes: 30,
    dataRegion: "eu_warsaw",
    aiTone: "polite",
    aiTemperature: 0.7,
  });
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(SEED_CONVERSATIONS[0].id);

  const t = TRANSLATIONS[language];

  // Language switcher helper
  const handleToggleLang = () => {
    setLanguage(language === "pl" ? "en" : "pl");
  };

  // State modifiers for shared context
  const handleUpdateConversation = (updated: Conversation) => {
    setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleAddNewConversation = (created: Conversation) => {
    setConversations(prev => [created, ...prev]);
    setSelectedConversationId(created.id);
  };

  const handleAddArticle = (art: KnowledgeArticle) => {
    setKnowledgeBase(prev => [art, ...prev]);
  };

  const handleEditArticle = (art: KnowledgeArticle) => {
    setKnowledgeBase(prev => prev.map(item => item.id === art.id ? art : item));
  };

  const handleDeleteArticle = (id: string) => {
    setKnowledgeBase(prev => prev.filter(item => item.id !== id));
  };

  // Safe reference to active conversation for ChatWidget simulator
  const activeChat = conversations.find(c => c.status !== "solved") || conversations[0] || null;

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-gray-200 font-sans antialiased overflow-x-hidden relative pb-16">
      
      {/* Top Header */}
      <header className="bg-[#0f1115] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg border border-white/10">
              <div className="w-4 h-4 bg-white rounded-sm rotate-45"></div>
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                AI Nexus <span className="text-indigo-405 text-indigo-400">Enterprise</span>
                <span className="text-[10px] bg-green-900/25 text-green-400 border border-green-500/30 py-0.5 px-2 rounded-full font-semibold hidden sm:inline">
                  AES-256 SECURE
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 hidden sm:block">
                {language === "pl" ? "Zarządzanie asystentem i analityka rozmów" : "AI Agent Control Console & Business Analytics"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Simulation Flag Status */}
            <div className="hidden lg:flex items-center gap-1.5 bg-[#16191f] px-3 py-1.5 rounded-lg border border-white/5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>UTC: 2026-05-21 23:14:22</span>
            </div>

            {/* Language Switcher */}
            <button
              id="lang-switcher-btn"
              onClick={handleToggleLang}
              className="bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg p-2 border border-white/10 flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors active:scale-95"
            >
              <Languages className="w-4 h-4 text-indigo-400" />
              <span>{language.toUpperCase()}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome & Sandbox Instruction Box */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        <div className="bg-gradient-to-br from-indigo-900/10 to-purple-900/10 border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="space-y-2 max-w-2xl text-left">
            <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" />
              {language === "pl" ? "Interaktywny Symulator Obsługi Klienta AI" : "Interactive AI Customer Support Simulator"}
            </h2>
            <p className="text-gray-350 text-xs leading-relaxed">
              {language === "pl" 
                ? "Witaj! Ten system w pełni demonstruje automatyczne wsparcie klientów oraz asystę konsultanta (Co-Pilot). Wykorzystuje zaawansowany silnik analizy do wyznaczania pilności spraw (urgency), wykrywania sentymentu i podawania sugestii akcji."
                : "Welcome! This dashboard fully demonstrates automated visitor chats alongside support co-pilot assistance. It evaluates problem severity, client sentiment, and dynamically formulates action scripts."}
            </p>
            
            {/* Step-by-step guidance */}
            <div className="pt-2">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                {language === "pl" ? "Jak przetestować cały obieg:" : "Steps to test the entire suite:"}
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-400 list-decimal pl-4">
                <li>{language === "pl" ? "Kliknij 'Widget u Klienta' w prawym dolnym rogu ekranu." : "Click on the bottom-right 'Client Widget' bubble."}</li>
                <li>{language === "pl" ? "Zasymuluj klienta pisząc np. 'Nie działa płatność' lub pytając o hasło." : "Simulate website visitor query (e.g. 'how to reset password' or write 'payment issue')."}</li>
                <li>{language === "pl" ? "Przejdź do zakładki 'Panel Główny' oraz 'Rozmowy na żywo'." : "Move to the 'Analytics' and 'Live Chats' panels in your admin menu."}</li>
                <li>{language === "pl" ? "Zatwierdź poziomy pilności, analizę sentimentu i sugestie AI." : "Review exact calculated urgency, semantic logs, and proposal triggers."}</li>
              </ul>
            </div>
          </div>

          <div className="sm:inline-flex hidden items-center gap-3 bg-[#16191f] p-4 border border-white/5 rounded-xl max-w-[240px] text-xs">
            <HelpCircle className="w-12 h-12 text-indigo-400 flex-shrink-0 animate-bounce" />
            <div className="text-left">
              <span className="font-bold text-gray-200 block">System RAG (Baza Wiedzy)</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">{language === "pl" ? "AI dopasowuje odpowiedzi pod fakty z bazy wiedzy!" : "AI retrieves instant facts context on-the-fly."}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Admin Tab Console Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        
        {/* Navigation Tabs bar */}
        <div className="flex border-b border-white/10 gap-1.5 overflow-x-auto pb-px mb-6">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold tracking-wide transition-all cursor-pointer rounded-t-xl ${
              activeTab === "dashboard"
                ? "text-white bg-white/5 border-t border-x border-white/10"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>{t.navDashboard}</span>
          </button>

          <button
            id="tab-livechat"
            onClick={() => setActiveTab("livechat")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold tracking-wide transition-all cursor-pointer rounded-t-xl relative ${
              activeTab === "livechat"
                ? "text-white bg-white/5 border-t border-x border-white/10"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>{t.navLiveChat}</span>
            {conversations.filter(c => c.status === "active_agent").length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <button
            id="tab-knowledge"
            onClick={() => setActiveTab("knowledge")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold tracking-wide transition-all cursor-pointer rounded-t-xl ${
              activeTab === "knowledge"
                ? "text-white bg-white/5 border-t border-x border-white/10"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>{t.navKnowledgeBase}</span>
          </button>

          <button
            id="tab-security"
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold tracking-wide transition-all cursor-pointer rounded-t-xl ${
              activeTab === "security"
                ? "text-white bg-white/5 border-t border-x border-white/10"
                : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>{t.navSecurity}</span>
          </button>
        </div>

        {/* Selected View Render */}
        <div className="min-h-[400px]">
          {activeTab === "dashboard" && (
            <Dashboard 
              language={language} 
              conversations={conversations} 
            />
          )}

          {activeTab === "livechat" && (
            <LiveChat
              language={language}
              conversations={conversations}
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId}
              onUpdateConversation={handleUpdateConversation}
            />
          )}

          {activeTab === "knowledge" && (
            <KnowledgeBase
              language={language}
              articles={knowledgeBase}
              onAddArticle={handleAddArticle}
              onEditArticle={handleEditArticle}
              onDeleteArticle={handleDeleteArticle}
            />
          )}

          {activeTab === "security" && (
            <SecurityConsole
              language={language}
              config={securityConfig}
              onUpdateConfig={setSecurityConfig}
            />
          )}
        </div>

      </main>

      {/* Client Chat Widget simulator - Bottom-Right layout */}
      <ChatWidget
        language={language}
        currentConversation={activeChat}
        knowledgeBase={knowledgeBase}
        securityMasking={securityConfig.dataMaskingEnabled}
        aiTone={securityConfig.aiTone}
        aiTemperature={securityConfig.aiTemperature}
        onUpdateConversation={handleUpdateConversation}
        onAddNewConversation={handleAddNewConversation}
      />

    </div>
  );
}
