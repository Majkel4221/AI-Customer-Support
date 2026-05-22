import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper to prevent server crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
        console.log("Gemini Client successfully initialized.");
      } catch (err) {
        console.error("Error initializing Gemini client:", err);
      }
    } else {
      console.warn("GEMINI_API_KEY is not configured or holds default placeholder. Using sandbox mock responses.");
    }
  }
  return aiClient;
}

// Sandbox intelligent lookup fallback
function getSandboxFallback(message: string, knowledgeBase: Array<any>, aiTone?: string): any {
  const msgLower = message.toLowerCase();
  
  // Try to search knowledgeBase for keyword matching
  let matchedArticle = null;
  if (Array.isArray(knowledgeBase)) {
    for (const article of knowledgeBase) {
      const titleLower = article.title.toLowerCase();
      const contentLower = article.content.toLowerCase();
      const matchTerms = titleLower.split(" ");
      // BUG FIX: Removed || contentLower.includes(term) which was always true and caused the first article to match regardless of user query!
      const hasMatch = matchTerms.some((term: string) => term.length > 3 && msgLower.includes(term));
      if (hasMatch || msgLower.includes(titleLower) || titleLower.includes(msgLower)) {
        matchedArticle = article;
        break;
      }
    }
  }

  let text = "";
  let urgency: "low" | "medium" | "high" | "critical" = "low";
  let urgencyReason = "Pytanie ogólne bez widocznych sygnałów krytycznych.";
  let category = "Ogólne / Inne";
  let sentiment: "positive" | "neutral" | "negative" = "neutral";
  let suggestions = [
    "Zaproponuj przesłanie instrukcji e-mailem",
    "Zapytaj o numer zamówienia",
    "Wyłącz bota i przejmij tę rozmowę"
  ];
  let insufficientInfo = false;

  const isGreeting = msgLower.includes("część") || msgLower.includes("helo") || msgLower.includes("witaj") || msgLower.includes("dzień dobry") || msgLower.includes("hej") || msgLower.includes("hello") || msgLower.includes("hi");

  if (msgLower.includes("błąd") || msgLower.includes("error") || msgLower.includes("nie działa") || msgLower.includes("crash")) {
    category = "Pomoc Techniczna";
    urgency = "high";
    urgencyReason = "Wykryto awarię lub niedziałające oprogramowanie u klienta.";
    sentiment = "negative";
    suggestions = [
      "Poproś o zrzut ekranu lub logi konsoli",
      "Sprawdź status serwerów",
      "Wyłącz bota i przejmij tę rozmowę"
    ];
    if (matchedArticle) {
       text = `Wykryłem artykuł w bazie wiedzy: "${matchedArticle.title}". Bazując na tym: ${matchedArticle.content.substring(0, 120)}... Czy te kroki rozwiązały błąd?`;
       insufficientInfo = false;
    } else {
       text = "Bardzo przepraszam za napotkane niedogodności. Niestety, nie znalazłem rozwiązania tego problemu w bazie wiedzy. Przekazuję sprawę do ludzkiego konsultanta, prosimy o chwilę cierpliwości.";
       insufficientInfo = true;
    }
  } else if (
    msgLower.includes("cena") || 
    msgLower.includes("faktura") || 
    msgLower.includes("płat") || 
    msgLower.includes("opł") || 
    msgLower.includes("koszt") || 
    msgLower.includes("pieniądz") || 
    msgLower.includes("abona") ||
    msgLower.includes("zamów") ||
    msgLower.includes("kup") ||
    msgLower.includes("transak")
  ) {
    category = "Finanse i Rozliczenia";
    urgency = "medium";
    urgencyReason = "Pytanie powiązane z płatnościami lub cennikiem usług.";
    sentiment = "neutral";
    suggestions = [
      "Wyślij ofertę PDF ze szczegółami pakietu",
      "Zaoferuj rabat powitalny 10% na start",
      "Połącz bezpośrednio z działem rozliczeń"
    ];
    if (matchedArticle) {
       text = `Nawiązując do naszej bazy wiedzy o cenach: ${matchedArticle.content}. Mam nadzieję, że to wyjaśnia kwestie kosztów. Czy chcesz otrzymać fakturę bezpośrednio?`;
       insufficientInfo = false;
    } else {
       text = "Kwestie płatności i cen są dla nas kluczowe. Niestety, nie odnalazłem tej precyzyjnej informacji w naszej bazie wiedzy. Przekazuję rozmowę do konsultanta z działu finansów.";
       insufficientInfo = true;
    }
  } else if (msgLower.includes("hasło") || msgLower.includes("hasla") || msgLower.includes("konto") || msgLower.includes("zalog") || msgLower.includes("login")) {
    category = "Bezpieczeństwo i Konta";
    urgency = "critical";
    urgencyReason = "Zgłoszenie związane z logowaniem i poświadczeniami użytkownika.";
    sentiment = "neutral";
    suggestions = [
      "Wygeneruj bezpieczny link resetujący hasło",
      "Zweryfikuj tożsamość użytkownika przez SMS",
      "Przejmij czat i pomóż użytkownikowi ręcznie"
    ];
    if (matchedArticle) {
      text = `Zgodnie z protokołem bezpieczeństwa ("${matchedArticle.title}"): ${matchedArticle.content}. Proszę postępować zgodnie z instrukcją.`;
      insufficientInfo = false;
    } else {
      text = "W kwestiach dostępu do konta bezpieczeństwo jest priorytetem. Nie mam w bazie wiedzy instrukcji dla tego dokładnego przypadku. Przekazuję sprawę do konsultanta, aby pomógł Ci bezpiecznie.";
      insufficientInfo = true;
    }
  } else if (isGreeting) {
    category = "Ogólne / Powitanie";
    urgency = "low";
    urgencyReason = "Standardowe powitanie lub zwrot kurtuazyjny.";
    sentiment = "positive";
    text = "Witaj! Jestem inteligentnym asystentem obsługi klienta. Jak mogę Ci dzisiaj pomóc? Możesz zapytać mnie o sprawy techniczne, płatności lub logowanie.";
    suggestions = [
      "Przedstaw główne moduły systemu",
      "Zaoferuj pomoc techniczną",
      "Zatrzymaj bota i rozmawiaj bezpośrednio"
    ];
    insufficientInfo = false;
  } else {
    // Normal backup
    if (matchedArticle) {
      text = `Znalazłem dopasowanie w bazie wiedzy (${matchedArticle.title}): "${matchedArticle.content}". Mam nadzieję, że to pomaga! Czy chcesz wiedzieć więcej?`;
      urgency = "low";
      urgencyReason = "Automatyczne dopasowanie bazy wiedzy przebiegło pomyślnie.";
      insufficientInfo = false;
    } else {
      text = "Przykro mi, ale nie znalazłem wystarczających informacji w bazy wiedzy na ten temat, by udzielić Ci rzetelnej odpowiedzi. Przekierowuję Twoją rozmowę bezpośrednio do konsultanta na żywo.";
      insufficientInfo = true;
      urgency = "medium";
      urgencyReason = "Brak pasujących artykułów w bazie wiedzy.";
    }
  }

  // Adjust style according to requested custom AI tone inside mock
  if (aiTone === "concise") {
    text = text.substring(0, 100) + "... [Skrócono wg reguły AI]";
  } else if (aiTone === "formal") {
    text = "Szanowny Kliencie! Informujemy: " + text + " Pozostajemy do dyspozycji.";
  }

  return {
    text: text + " [Tryb Sandbox AI]",
    urgency,
    urgencyReason,
    category,
    sentiment,
    suggestions,
    insufficientInfo
  };
}

// Real-Time Chat analysis and answer generation route
app.post("/api/chat", async (req, res) => {
  const { message, history, knowledgeBase, aiTone, aiTemperature } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const ai = getAI();

  // If Gemini is not available, return our sandbox fallback response
  if (!ai) {
    const fallback = getSandboxFallback(message, knowledgeBase, aiTone);
    return res.json(fallback);
  }

  try {
    // Format knowledge base context beautifully
    let kbContext = "Brak artykułów w bazie wiedzy.";
    if (Array.isArray(knowledgeBase) && knowledgeBase.length > 0) {
      kbContext = knowledgeBase.map((art: any, index: number) => {
        return `ARTYKUŁ ${index + 1}:
Tytuł: ${art.title}
Kategoria: ${art.category}
Treść: ${art.content}`;
      }).join("\n---\n");
    }

    // Format chat history
    let chatHistoryContext = "Brak historii.";
    if (Array.isArray(history) && history.length > 0) {
      chatHistoryContext = history.map((h: any) => `${h.sender === "user" ? "Klient" : "Asystent"}: ${h.text}`).join("\n");
    }

    // System-level style rules matching the selected AI tone parameter
    let toneInstruction = "Utrzymuj uprzejmy, ciepły i pomocny ton głosu (często przepraszaj za utrudnienia, dziękuj za kontakt, pisz profesjonalnie).";
    if (aiTone === "concise") {
      toneInstruction = "Utrzymuj absolutnie zwięzły, krótki bokserski charakter wypowiedzi. Pisz konkretne fakty w max 1 lub 2 prostych, krótkich zdaniach, pomijając zbędne uprzejmości i zbędny tekst wstępny.";
    } else if (aiTone === "formal") {
      toneInstruction = "Utrzymuj ton formalny, bardzo bezpieczny i ustrukturyzowany. Przestrzegaj biznsowych standardów VIP. Zwracaj się z najwyższym szacunkiem per Pan/Pani, używając 'Szanowny Kliencie' w nagłówku i kończąc zwrotem 'Z poważaniem'.";
    }

    // Construct highly structured instruction
    const prompt = `Jesteś mózgiem systemu "AI Customer Support Hub" - inteligentnego, wielojęzycznego czatbota dla przedsiębiorstw.
Twoim zadaniem jest przeanalizować najnowszą wiadomość od klienta, wyznaczyć kategorię, poziom pilności problemu wraz z uzasadnieniem, sentyment klienta, wygenerować bezpieczną, precyzyjną odpowiedź oraz sformułować dla konsultanta 3 automatyczne, inteligentne sugestie akcji lub odpowiedzi (w formie krótkich zadań lub gotowych fraz).

DANE SYSTEMOWE:
---
Baza Wiedzy Przedsiębiorstwa (Użyj tych faktów jako JEDYNEGO źródła prawdy przy generowaniu odpowiedzi związanych z firmą):
${kbContext}

Historia Rozmowy:
${chatHistoryContext}

Najnowsza wiadomość od klienta:
"${message}"
---

ZASADY:
1. Jeśli najnowsza wiadomość dotyczy informacji zawartych w bazie wiedzy, odpowiedz dokładnie na ich podstawie. Bądź merytoryczny i dokładny.
2. Jeśli baza wiedzy nie odpowiada na to pytanie lub brak w niej informacji niezbędnych do udzielenia rzetelnej, konkretnej odpowiedzi, ustaw pole 'insufficientInfo' na true. W przeciwnym razie ustaw na false.
3. Gdy 'insufficientInfo' jest true, odpowiedz uprzejmie w imieniu firmy, że obecnie nie posiadasz precyzyjnej instrukcji na to pytanie w swojej bazie wiedzy, i zaoferuj, że ludzki konsultant natychmiast przejmie tę rozmowę, aby pomóc bezpośrednio (odpowiedź w języku klienta, np. polskim lub angielskim).
4. Styl i ton wypowiedzi bota (STOSUJ BEZWZGLĘDNIE):
   ${toneInstruction}
5. Wyznacz poziom pilności (urgency):
   - 'critical' (krytyczny): wyciek danych, awaria systemów, zablokowane konto z kluczową transakcją, bezpośrednia strata finansowa.
   - 'high' (wysoki): uszkodzona funkcja, krytyczne opóźnienie dostawy, podwójne pobranie opłaty, denerwujący błąd techniczny.
   - 'medium' (średni): wątpliwości rozliczeniowe, pytania o konfigurację, jak zmienić adres.
   - 'low' (niski): powitania, ogólne zapytania, podziękowania.
6. Generuj dokładnie 3 propozycje akcji / odpowiedzi dla agenta (suggestions). Mogą być przydatnymi komendami technologicznymi lub zwięzłymi tekstami gotowymi do wysłania.
7. Dopasuj język odpowiedzi (text) oraz uzasadnienia pilności (urgencyReason) do języka, w którym pisze klient (głównie polski lub angielski).
8. Wykrywanie zmiany tematu: Zwróć szczególną uwagę na ewentualną zmianę tematu przez klienta w jego najnowszej wiadomości. Pomimo że historia rozmowy (history) mogła dotyczyć innego tematu (np. zmiany hasła), Twoja odpowiedź i kategoryzacja muszą odnosić się wyłącznie do bieżącego, najnowszego pytania/problemu klienta (np. opłacenia zamówienia). Całkowicie zignoruj i zakończ stary wątek w nowej odpowiedzi, jeśli nastąpiła zmiana intencji/tematu rozmowy.`;

    // Query Gemini 3.5 Flash using strict JSON response schema and dynamic temperature value parameter
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: typeof aiTemperature === "number" ? aiTemperature : 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The helpful generated response back to the customer, based on the provided Knowledge Base if relevant. Safe, professional, and max 3 sentences.",
            },
            urgency: {
              type: Type.STRING,
              description: "Must be exactly one of: 'low', 'medium', 'high', 'critical'."
            },
            urgencyReason: {
              type: Type.STRING,
              description: "Concise reason (in client's language) describing why this urgency level was calculated."
            },
            category: {
              type: Type.STRING,
              description: "Suggested enterprise category, e.g., 'Rozliczenia', 'Konto', 'Wysyłka', 'Pomoc techniczna', 'Ogólne'."
            },
            sentiment: {
              type: Type.STRING,
              description: "Detected sentiment: 'positive', 'neutral', 'negative'."
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 distinct quick reply proposals or action suggestions for the support agent."
            },
            insufficientInfo: {
              type: Type.BOOLEAN,
              description: "Must be true if the Knowledge Base does not have enough context/information to answer the client's query accurately, necessitating takeover by a support operator. Otherwise false."
            }
          },
          required: ["text", "urgency", "urgencyReason", "category", "sentiment", "suggestions", "insufficientInfo"]
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText.trim());
      return res.json(parsed);
    } else {
      throw new Error("No text returned from Gemini");
    }

  } catch (error: any) {
    console.error("Gemini processing error:", error);
    // Graceful fallback on API issues
    const fallback = getSandboxFallback(message, knowledgeBase);
    fallback.text += " (Sygnał zapasowy po błędzie API)";
    return res.json(fallback);
  }
});

// Setup Express SPA static bundle routing vs Vite development devserver
async function startServer() {
  let isProd = process.env.NODE_ENV === "production";
  
  // If NODE_ENV is not explicitly set, determine production by checking file or directory paths
  if (!isProd) {
    try {
      const currentDir = typeof __dirname !== "undefined" ? __dirname : "";
      const currentFile = typeof __filename !== "undefined" ? __filename : "";
      if (
        (currentFile && (currentFile.endsWith(".cjs") || currentFile.includes("dist") || currentFile.includes("server.cjs"))) ||
        (currentDir && (currentDir.includes("dist") || currentDir.includes("dist/")))
      ) {
        isProd = true;
      }
    } catch (e) {
      isProd = false;
    }
  }

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "custom", // Use custom so Vite doesn't intercept HTML but lets our middleware do it with transformIndexHtml
      });
      app.use(vite.middlewares);
      
      app.get("*", async (req, res, next) => {
        const url = req.originalUrl;
        
        // Skip API routes
        if (url.startsWith("/api/")) {
          return next();
        }

        try {
          const indexPath = path.resolve(process.cwd(), "index.html");
          if (!fs.existsSync(indexPath)) {
            return next();
          }
          let template = fs.readFileSync(indexPath, "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
      console.log("Vite development middleware mounted successfully with HTML rendering.");
    } catch (err) {
      console.warn("Vite loader failed. Falling back to production mode static routing:", err);
      serveStaticProduction();
    }
  } else {
    serveStaticProduction();
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running secure port ${PORT} (isProd: ${isProd})`);
  });
}

function serveStaticProduction() {
  // Always resolve the static folder relative to the workspace root first
  const distPath = path.join(process.cwd(), "dist");
  
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  console.log(`Serving static files from production folder: ${distPath}`);
}

startServer();
