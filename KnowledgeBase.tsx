export type Language = "pl" | "en";

export type UrgencyType = "low" | "medium" | "high" | "critical";

export interface Message {
  id: string;
  sender: "user" | "bot" | "agent";
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userName: string;
  userEmail: string;
  status: "active_bot" | "active_agent" | "solved";
  urgency: UrgencyType;
  urgencyReason?: string;
  category?: string;
  messages: Message[];
  suggestions?: string[];
  sentiment?: "positive" | "neutral" | "negative";
  language?: string;
  insufficientInfo?: boolean;
  lastUpdated: string;
}

export interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  lastUpdated: string;
}

export interface SecurityConfig {
  dataMaskingEnabled: boolean;
  autoPIICleanup: boolean;
  retentionDays: number;
  sessionTimeoutMinutes: number;
  dataRegion: string;
  aiTone: "polite" | "concise" | "formal";
  aiTemperature: number;
}

// Global translations for simple multi-language support (PL / EN)
export const TRANSLATIONS = {
  pl: {
    appName: "AI Support Hub",
    navDashboard: "Panel Główny",
    navLiveChat: "Rozmowy na żywo",
    navKnowledgeBase: "Baza wiedzy",
    navSecurity: "Bezpieczeństwo & RODO",
    clientChatWidget: "Widget u Klienta",
    language: "Język",
    totalConversations: "Wszystkie rozmowy",
    solvedByBot: "Rozwiązane przez AI",
    transferredToAgent: "Przekazane do agenta",
    averageResponseTime: "Śr. czas odpowiedzi",
    urgencyDistribution: "Rozkład pilności zgłoszeń",
    csatOverview: "Zadowolenie klientów (CSAT)",
    conversationsOverTime: "Wolumen rozmów w czasie",
    urgencyLow: "Niska",
    urgencyMedium: "Średnia",
    urgencyHigh: "Wysoka",
    urgencyCritical: "Krytyczna",
    category: "Kategoria",
    status: "Status",
    lastMessage: "Ostatnia wiadomość",
    noActiveChats: "Brak aktywnych konwersacji.",
    chatWithClient: "Rozmowa z",
    aiAnalysis: "Analiza AI",
    problemUrgency: "Pilność problemu",
    calculatedUrgency: "Wyznaczona pilność",
    urgencyExplanation: "Uzasadnienie pilności",
    detectedSentiment: "Sentyment klienta",
    agentCopilotSuggestions: "Sugestie AI dla Agenta (Co-Pilot)",
    useSuggestionButton: "Użyj sugestii",
    takeOverChat: "Przejmij czat (Zostań Agentem)",
    returnToBot: "Przywróć Chatbota AI",
    solvedCheckbox: "Oznacz jako rozwiązane",
    writeMessagePlaceholder: "Wpisz wiadomość jako agent...",
    sendMessage: "Wyślij",
    allArticles: "Artykuły bazy wiedzy",
    addNewArticle: "Dodaj nowy artykuł",
    title: "Tytuł artykułu",
    content: "Treść artykułu",
    categoryLabel: "Kategoria",
    saveArticle: "Zapisz",
    editArticle: "Edytuj artykuł",
    deleteArticle: "Usuń",
    knowledgeBaseIntegrationActive: "Integracja bazy wiedzy aktywna",
    securityAndRodoConfig: "Konfiguracja bezpieczeńtwa i RODO",
    dataMaskingTitle: "Maskowanie danych wrażliwych",
    dataMaskingDesc: "Automatycznie ukrywaj adresy e-mail, numery telefonów i numery kart w czatach (np. [MASKED_EMAIL]).",
    autoPIITitle: "Automatyczne czyszczenie PII",
    autoPIIDesc: "Usuwaj dane osobowe klientów po zakończeniu sesji w celu spełnienia wymogów RODO.",
    retentionDaysTitle: "Okres retencji logów (dni)",
    sessionTimeoutTitle: "Limit wygaśnięcia sesji (minut)",
    dataStorageRegion: "Region przechowywania informacji",
    gdprCompliantStatus: "Stan zgodności z RODO: Zweryfikowany",
    activeSecurityProtocols: "Aktywne protokoły ochrony",
    sslEncryption: "Szyfrowanie SSL/TLS (256-bit)",
    dataAnonymized: "Anonimizacja w locie",
    knowledgeIntegrated: "Dopasowanie kontekstu bazy wiedzy",
    botGreeting: "Cześć! W czym mogę dziś pomóc? Opisz swój problem.",
    typeProblemHere: "Napisz wiadomość...",
    sendButton: "Wyślij",
    analysisCategory: "Wymieniona kategoria",
    sentimentPositive: "Pozytywny",
    sentimentNeutral: "Neutralny",
    sentimentNegative: "Negatywny",
  },
  en: {
    appName: "AI Support Hub",
    navDashboard: "Analytics Dashboard",
    navLiveChat: "Live Chats",
    navKnowledgeBase: "Knowledge Base",
    navSecurity: "Security & RODO/GDPR",
    clientChatWidget: "Client Widget",
    language: "Language",
    totalConversations: "Total Conversations",
    solvedByBot: "Solved by Bot",
    transferredToAgent: "Transferred to Agent",
    averageResponseTime: "Avg. Response Time",
    urgencyDistribution: "Urgency Distribution",
    csatOverview: "Customer Satisfaction (CSAT)",
    conversationsOverTime: "Conversations Over Time",
    urgencyLow: "Low",
    urgencyMedium: "Medium",
    urgencyHigh: "High",
    urgencyCritical: "Critical",
    category: "Category",
    status: "Status",
    lastMessage: "Last Message",
    noActiveChats: "No active conversations.",
    chatWithClient: "Chatting with",
    aiAnalysis: "AI Insights",
    problemUrgency: "Problem Urgency",
    calculatedUrgency: "Calculated Urgency",
    urgencyExplanation: "Urgency Reason",
    detectedSentiment: "Detected Sentiment",
    agentCopilotSuggestions: "AI Suggestions for Agent (Co-Pilot)",
    useSuggestionButton: "Use proposal",
    takeOverChat: "Take Over (Be Human Agent)",
    returnToBot: "Restore AI Automaton",
    solvedCheckbox: "Mark as solved",
    writeMessagePlaceholder: "Type message as support agent...",
    sendMessage: "Send",
    allArticles: "Knowledge Articles",
    addNewArticle: "Add New Article",
    title: "Article Title",
    content: "Article Content",
    categoryLabel: "Category",
    saveArticle: "Save",
    editArticle: "Edit Article",
    deleteArticle: "Delete",
    knowledgeBaseIntegrationActive: "Knowledge Base sync status active",
    securityAndRodoConfig: "Security & GDPR / RODO Config",
    dataMaskingTitle: "Sensitive Data Masking",
    dataMaskingDesc: "Automatically mask emails, phone numbers, and card details inside chat screens (eg. [MASKED_EMAIL]).",
    autoPIITitle: "Automated PII Shredder",
    autoPIIDesc: "Purge client details upon conversation resolve to comply with GDPR.",
    retentionDaysTitle: "Log Retention Period (days)",
    sessionTimeoutTitle: "Session Expiry Threshold (mins)",
    dataStorageRegion: "Server Data Storage Region",
    gdprCompliantStatus: "GDPR Status: Compliant & Verified",
    activeSecurityProtocols: "Active Security Protocols",
    sslEncryption: "256-bit SSL/TLS Transport Encryption",
    dataAnonymized: "On-the-fly anonymization active",
    knowledgeIntegrated: "Contextual Knowledge base mapping active",
    botGreeting: "Hello! How can I assist you today? Please detail your issue.",
    typeProblemHere: "Type your message...",
    sendButton: "Send",
    analysisCategory: "Identified Category",
    sentimentPositive: "Positive",
    sentimentNeutral: "Neutral",
    sentimentNegative: "Negative",
  }
};
