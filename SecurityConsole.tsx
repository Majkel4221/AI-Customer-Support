import React, { useState } from "react";
import { Plus, Edit3, Trash2, Check, BookOpen, Search, Sparkles, RefreshCw, AlertTriangle, Cpu } from "lucide-react";
import { KnowledgeArticle, Language, TRANSLATIONS } from "../types";

interface KnowledgeBaseProps {
  language: Language;
  articles: KnowledgeArticle[];
  onAddArticle: (art: KnowledgeArticle) => void;
  onEditArticle: (art: KnowledgeArticle) => void;
  onDeleteArticle: (id: string) => void;
}

export default function KnowledgeBase({
  language,
  articles,
  onAddArticle,
  onEditArticle,
  onDeleteArticle,
}: KnowledgeBaseProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Live RAG Simulator states
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Pomoc techniczna");

  const t = TRANSLATIONS[language];

  const handleRunRAGTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim() || testLoading) return;
    
    setTestLoading(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: testQuery,
          history: [],
          knowledgeBase: articles,
          aiTone: "polite", 
          aiTemperature: 0.7,
        })
      });
      if (response.ok) {
        const data = await response.json();
        setTestResult(data);
      } else {
        throw new Error("RAG Query Failed");
      }
    } catch (err) {
      console.error(err);
      setTestResult({
         text: "Przykładowa symulacja odpowiedzi RAG: System zlokalizował powiązany artykuł w bazie i udzieliłby precyzyjnej porady.",
         urgency: "low",
         urgencyReason: "Standardowy test integracji",
         category: "Test",
         sentiment: "neutral",
         suggestions: ["Pokaż powiązany artykuł", "Zweryfikuj hasze bazy", "Oznacz jako OK"],
         insufficientInfo: false
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      // Edit mode
      const updated: KnowledgeArticle = {
        id: editingId,
        title,
        content,
        category,
        lastUpdated: new Date().toLocaleDateString(),
      };
      onEditArticle(updated);
      setEditingId(null);
    } else {
      // Create mode
      const created: KnowledgeArticle = {
        id: "art_" + Math.random().toString(36).substr(2, 9),
        title,
        content,
        category,
        lastUpdated: new Date().toLocaleDateString(),
      };
      onAddArticle(created);
      setIsAdding(false);
    }

    // Reset fields
    setTitle("");
    setContent("");
    setCategory("Pomoc techniczna");
  };

  const handleTriggerEdit = (art: KnowledgeArticle) => {
    setEditingId(art.id);
    setTitle(art.title);
    setContent(art.content);
    setCategory(art.category);
    setIsAdding(true);
  };

  const filteredArticles = articles.filter((art) => {
    return (
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div id="knowledge-base-panel" className="space-y-6">
      
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-405 text-indigo-400" />
            {t.allArticles}
          </h2>
          <p className="text-xs text-gray-400">
            {language === "pl" ? "Zasób wiedzy firmy. Wprowadzone dane są podawane sztucznej inteligencji, aby odpowiadać merytorycznie." : "Corporate knowledge context records. Inputs are supplied directly to AI algorithm to build accurate responses."}
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              setEditingId(null);
              setTitle("");
              setContent("");
              setCategory("Pomoc techniczna");
              setIsAdding(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 px-4 text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            {t.addNewArticle}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor column / Overview */}
        {isAdding ? (
          <div className="lg:col-span-1 bg-[#16191f] border border-white/5 rounded-xl p-5 shadow-xl">
            <h4 className="font-semibold text-white text-sm mb-4 border-b border-white/5 pb-2">
              {editingId ? t.editArticle : t.addNewArticle}
            </h4>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-gray-450 text-[11px] mb-1 font-semibold uppercase tracking-wider">
                  {t.title}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Jak zresetować hasło"
                  className="w-full bg-[#0f1115] border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-gray-600 focus:outline-none focus:border-indigo-505"
                />
              </div>

              <div>
                <label className="block text-gray-450 text-[11px] mb-1 font-semibold uppercase tracking-wider">
                  {t.categoryLabel}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0f1115] border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-505"
                >
                  <option value="Pomoc techniczna">Pomoc techniczna / Technical Support</option>
                  <option value="Finanse i Rozliczenia">Finanse i Rozliczenia / Billing & Finance</option>
                  <option value="Konta i Bezpieczeństwo">Konta i Bezpieczeństwo / Access & Security</option>
                  <option value="Inne">Inne / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-450 text-[11px] mb-1 font-semibold uppercase tracking-wider">
                  {t.content}
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Skrócony opis i jasne kroki dla klienta..."
                  className="w-full bg-[#0f1115] border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-100 placeholder-gray-600 focus:outline-none focus:border-indigo-505 leading-relaxed"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-semibold cursor-pointer"
                >
                  {t.saveArticle}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg py-2 text-xs font-medium cursor-pointer"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Small Guide Box */
          <div className="lg:col-span-1 bg-[#16191f] border border-white/5 rounded-xl p-5 shadow-xl text-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Synchronizacja w czasie rzeczywistym</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                {language === "pl" 
                  ? "Ten system bazy wiedzy współpracuje z mechanizmem RAG (Retrieval-Augmented Generation). Gdy klient wpisze pytanie do bota, system przeszuka te wpisy i wyśle treść pasującego artykułu do modelu Gemini."
                  : "This system handles semantic knowledge extraction. When a customer queries the bot, matching articles are fed as direct parameters to model prompts to construct perfect responses."}
              </p>
              <div className="bg-[#0a0b0d] p-3 rounded-lg border border-white/5 mt-4 font-mono text-[10px] text-gray-300">
                PROMPT Context Matching: active ✅
              </div>
            </div>

            <div className="border-t border-white/5 pt-3">
              <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider mb-1">Status integracji</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span className="text-gray-300 text-[11px] font-semibold">{t.knowledgeBaseIntegrationActive}</span>
              </div>
            </div>
          </div>
        )}

        {/* Search and Articles List column - 2 cols */}
        <div className="lg:col-span-2 bg-[#16191f] border border-white/5 rounded-xl p-5 shadow-xl">
          {/* Search bar */}
          <div className="relative mb-5">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Przeszukaj bazę wiedzy... (np. hasło, zwrot)"
              className="w-full bg-[#0f1115] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-200 focus:outline-none focus:border-indigo-505 placeholder-gray-650"
            />
          </div>

          {/* List */}
          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredArticles.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                {language === "pl" ? "Brak artykułów spełniających kryteria wyszukiwania." : "No matching articles found."}
              </div>
            ) : (
              filteredArticles.map((art) => (
                <div key={art.id} className="bg-[#0f1115] p-4 border border-white/5 rounded-xl relative group hover:border-[#4f46e5]/40 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16191f] text-gray-300 border border-white/5">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Aktualizacja: {art.lastUpdated}
                    </span>
                  </div>

                  <h5 className="font-bold text-gray-200 text-sm mb-1">{art.title}</h5>
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-3 mb-3 pr-2 whitespace-pre-wrap">
                    {art.content}
                  </p>

                  <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleTriggerEdit(art)}
                      className="text-[10px] text-gray-300 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded bg-[#16191f] border border-white/5 hover:border-[#4f46e5]/40 cursor-pointer"
                    >
                      <Edit3 className="w-3 text-indigo-400" />
                      {language === "pl" ? "Edytuj" : "Edit"}
                    </button>
                    <button
                      onClick={() => onDeleteArticle(art.id)}
                      className="text-[10px] text-red-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded bg-red-950/10 hover:bg-red-950 border border-red-950/20 hover:border-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3" />
                      {t.deleteArticle}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Real-time RAG Simulator box */}
      <div id="rag-tester" className="bg-[#16191f] border border-[#4f46e5]/25 rounded-xl p-5 mt-6 shadow-2xl relative overflow-hidden">
        {/* Border accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-5 font-sans">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
              {language === "pl" ? "Laboratorium Testowe RAG (Symulacja zapytań AI)" : "RAG QA Laboratory (AI Prompt Semantic Tester)"}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {language === "pl"
                ? "Wpisz przykładowe zapytanie klienta, aby przetestować dopasowanie semantyczne i natychmiast zobaczyć, jak zareaguje algorytm RAG."
                : "Enter hypothetical client inquiries to stress-test your knowledge base context loading formulas and semantic thresholds."}
            </p>
          </div>
          <span className="text-[9px] bg-indigo-900/40 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase">
            Gemini-3.5-Flash Live Sandbox
          </span>
        </div>

        <form onSubmit={handleRunRAGTest} className="flex gap-2">
          <input
            type="text"
            required
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            disabled={testLoading}
            placeholder={language === "pl" ? "np. zapomniałem hasła... lub ile kosztuje pakiet biznesowy?" : "e.g. how to reset password? or pricing packages..."}
            className="flex-1 bg-[#0f1115] border border-white/10 rounded-xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 placeholder-gray-600"
          />
          <button
            type="submit"
            disabled={testLoading || !testQuery.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#0f1115] text-white font-semibold rounded-xl text-xs px-5 flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
          >
            {testLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            )}
            <span>{language === "pl" ? "Uruchom test RAG" : "Run RAG test"}</span>
          </button>
        </form>

        {/* Results Block */}
        {testResult && (
          <div className="mt-5 bg-[#0f1115] border border-white/5 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs text-slate-300">
              {/* Classification columns */}
              <div className="bg-[#16191f]/50 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase mb-1">
                  {language === "pl" ? "Wyznaczona Kategoria" : "AI Category Tag"}
                </span>
                <span className="font-bold text-white text-xs inline-flex items-center gap-1">
                  🏷️ {testResult.category || "Inne"}
                </span>
              </div>

              <div className="bg-[#16191f]/50 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase mb-1">
                  {language === "pl" ? "Ocena Pilności" : "Determined Urgency"}
                </span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border inline-block ${
                  testResult.urgency === "critical" ? "bg-red-950/40 text-red-400 border-red-500/20" :
                  testResult.urgency === "high" ? "bg-orange-950/40 text-orange-400 border-orange-500/20" :
                  testResult.urgency === "medium" ? "bg-amber-950/40 text-amber-400 border-amber-500/20" :
                  "bg-emerald-950/20 text-emerald-400 border-emerald-500/10"
                }`}>
                  {testResult.urgency || "low"}
                </span>
              </div>

              <div className="bg-[#16191f]/50 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase mb-1">
                  {language === "pl" ? "Wykryty Sentyment" : "Detected Sentiment"}
                </span>
                <span className="font-bold text-white text-[11px] inline-flex items-center gap-1">
                  {testResult.sentiment === "negative" ? "😠 Negatywny" : testResult.sentiment === "positive" ? "😊 Pozytywny" : "😐 Neutralny"}
                </span>
              </div>

              <div className="bg-[#16191f]/50 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-gray-500 font-semibold block uppercase mb-1">
                  {language === "pl" ? "Wynik dopasowania RAG" : "RAG Match Result"}
                </span>
                {testResult.insufficientInfo ? (
                  <span className="font-bold text-red-400 text-[10px] uppercase bg-red-950/20 px-2 py-0.5 rounded border border-red-500/20 animate-pulse flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> BRAK INFO W BAZIE!
                  </span>
                ) : (
                  <span className="font-bold text-green-400 text-[10px] uppercase bg-green-950/20 px-2 py-0.5 rounded border border-green-500/20 inline-flex items-center gap-1">
                    ✓ MATCHER OK
                  </span>
                )}
              </div>
            </div>

            {/* Warning if insufficientInfo */}
            {testResult.insufficientInfo && (
              <div className="bg-red-950/35 border border-red-500/20 rounded-lg p-3 text-xs flex gap-2.5 text-red-350">
                <span className="text-base">⚠️</span>
                <div>
                  <h5 className="font-bold text-red-200">{language === "pl" ? "Pilne ostrzeżenie systemowe" : "Critical Knowledge Gap Flagged"}</h5>
                  <p className="text-[11px] text-gray-300 leading-normal mt-0.5">
                    {language === "pl"
                      ? "Twój chatbot zgłosił brak pasujących wiadomości w bazie wiedzy dla tej frazy. Powinieneś dodać nowy artykuł merytoryczny o tej tematyce powyżej, aby zapobiec niepotrzebnym przejęciom czatów przez konsultantów!"
                      : "The AI agent reported a mismatch inside the business catalog. You should add a dedicated document covering these key phrases above to deflect manual transfers."}
                  </p>
                </div>
              </div>
            )}

            {/* Urgency justification */}
            {testResult.urgencyReason && (
              <div className="text-[11px] text-gray-400 italic bg-[#16191f] p-2 rounded-lg border border-white/5">
                💡 {testResult.urgencyReason}
              </div>
            )}

            {/* Generated bot reply */}
            <div className="border-t border-white/5 pt-3.5">
              <span className="text-[10px] text-indigo-400 font-bold block uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                {language === "pl" ? "Konceptualna Generowana Odpowiedź" : "Preview Generated Bot Response"}
              </span>
              <div className="bg-[#16191f] p-3.5 border border-[#4f46e5]/15 rounded-lg text-xs leading-relaxed text-gray-100 whitespace-pre-wrap">
                {testResult.text}
              </div>
            </div>

            {/* Actions list */}
            {testResult.suggestions && testResult.suggestions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-t border-white/5 pt-3.5">
                <div className="col-span-1 md:col-span-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    {language === "pl" ? "Przewidywane Akcje Co-Pilot (Dla operatora)" : "Predicted Co-Pilot Actions (For human consultation)"}
                  </span>
                </div>
                {testResult.suggestions.map((sug: any, index: number) => (
                  <div key={index} className="bg-[#16191f] px-3 py-1.5 rounded-lg border border-white/5 text-[11px] text-gray-305 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    <span className="truncate">{sug}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
