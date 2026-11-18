import { useState } from "react";
import { api } from "./api.js";
import { useHarbor } from "./harbor.jsx";
import { Icon, LEVEL } from "./components.jsx";

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Friendly small talk, checked first. `words` match whole words so "hi" does not fire inside "this".
const CHAT = [
  { words: ["hi", "hello", "hey", "vanakkam", "vannakam", "hii", "hiii", "yo"], say: ["Vanakkam! 👋 Good to see you. What's up, need the sea report or fish prices?", "Hey hey! 😊 Ready when you are. Ask me about the sea, prices or fish.", "Vanakkam da! What can I help you with today?"] },
  { words: ["thanks", "thank", "thankyou", "nandri", "tq", "thx"], say: ["Anytime! 😊 Shout if you need anything else.", "Nandri! Happy to help. Stay safe out there 🌊", "No problem at all! Come back whenever."] },
  { words: ["bye", "goodbye", "later", "gn", "night", "okay bye"], say: ["Bye bye! Take care, and check the sea before you head out 🌊", "See you later! Stay safe.", "Catch you later! 🐟"] },
  { words: ["how are you", "how r u", "how are u", "sup", "whats up", "what's up", "wassup", "eppadi irukka", "epdi irukinga"], say: ["I'm doing great, thanks for asking! 😄 Sea looks interesting today. Want me to check it?", "All good here! Just floating around waiting for questions 🌊 What about you?", "Nalla irukken! You tell me, what do you need?"] },
  { words: ["who are you", "your name", "what are you", "who r u"], say: ["I'm Meen, your Kadal Connect buddy 🐟 I can check the sea, plan trips, and help with buying or selling fish."], },
  { words: ["joke", "funny", "laugh"], say: ["Why don't fish play cricket? They're scared of the nets! 🏏🐟", "What do you call a fish with no eyes? A fsh! 😄", "Why did the prawn go to therapy? It felt a little shellfish."] },
  { words: ["ok", "okay", "k", "cool", "nice", "great", "super", "good", "fine", "sari", "seri"], say: ["Cool! 👍 Anything else?", "Super! Let me know if you need more.", "Nice! I'm here if you need me."] },
  { words: ["love you", "best", "awesome", "amazing", "superb"], say: ["Aww, thank you! 😊 That made my day.", "You're too kind! Now, how can I help?"] },
  { words: ["sad", "tired", "bored", "worried", "scared", "tension"], say: ["Hang in there 💙 Long days on the sea are tough. Want me to check if the weather's calm for you?", "I hear you. Take a breather. If it's about the weather, I can check the sea for you right now."] },
];

const FAQ = [
  { keys: ["buy", "buyer", "purchase", "order"], answer: "Easy! Go to Marketplace, pick a catch you like and tap Request. Add your address and a small message if you want. Once the seller accepts, you'll see their phone number and can call to fix the pickup 📞" },
  { keys: ["address", "deliver", "location"], answer: "You can save your address under Account. The seller sees your name and town when you send a request, and your full address and phone only after they accept." },
  { keys: ["sell", "fisher", "listing", "post"], answer: "Got fish to sell? Log in as a fisherman, open Sell, choose the fish, quantity and price per kg, and post it. The form even shows the latest harbor price so you can price it right 🐟" },
  { keys: ["price", "rate", "market"], answer: "Check the Prices page! You can compare rates for every fish across harbors and see where it's selling highest. Always confirm the final rate with the other person before you deal." },
  { keys: ["plan", "trip", "go out", "boat"], answer: "Open Trip planner, pick your boat, day, start time and hours. I'll tell you Go, Caution or Don't go based on the forecast ⛵" },
  { keys: ["account", "register", "login", "sign"], answer: "Tap Log in if you already have an account, or Create account to join as a buyer or fisherman. It takes a minute!" },
  { keys: ["emergency", "rescue", "danger", "help me", "sos"], answer: "🚨 If you're in danger call 112 right now. Coast Guard: 1554. Disaster control: 1077. Stay calm and follow their instructions." },
];
const QUICK = ["Weather today", "Best time to fish", "Plan a trip", "How do I buy fish?", "Tell me a joke"];
const WX_WORDS = ["weather", "wave", "wind", "sea", "forecast", "rain", "today", "tomorrow", "best time", "window", "safe", "climate", "storm"];
const hasWord = (q, w) => (w.includes(" ") ? q.includes(w) : new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(q));

/* Friendly mascot: a speech bubble with a little fish inside */
export const BotLogo = ({ size = 28 }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true">
    <path d="M6 5h20a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4H15l-6 5v-5H6a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z" fill="currentColor" opacity=".18" />
    <path d="M6 5h20a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4H15l-6 5v-5H6a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8.5 14.5c2.2-3.2 5.6-3.8 8.5-1.6l3.5-1.9v6l-3.5-1.9c-2.9 2.2-6.3 1.6-8.5-1.6z" fill="currentColor" />
    <circle cx="11.2" cy="13.7" r=".9" fill="#fff" />
  </svg>
);

export default function Chatbot() {
  const { id, harbor } = useHarbor();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([{ from: "bot", text: "Vanakkam! 👋 I'm Meen. Ask me about today's sea, fish prices, trip plans or how to buy and sell. Or just say hi!" }]);

  async function answerFor(question) {
    const q = question.toLowerCase().trim();
    const talk = q.length < 40 && CHAT.find((c) => c.words.some((w) => hasWord(q, w)));
    if (talk && !WX_WORDS.some((k) => q.includes(k))) return pick(talk.say);
    if (WX_WORDS.some((k) => q.includes(k)) && id) {
      try {
        const w = await api(`/weather/?harbor=${id}`);
        const win = w.best_windows?.[0];
        const mood = w.level === "SAFE" ? "Sea looks good today 👍" : w.level === "CAUTION" ? "Sea is a bit rough, so go careful ⚠️" : "Sea is rough today. Better stay ashore 🛑";
        return `${mood}\n${harbor?.name}: ${LEVEL[w.level].label}. Waves ${w.wave_height_m ?? "–"} m, gusts ${w.gust_kmh ?? "–"} km/h, rain chance ${w.rain_pct ?? "–"}%.\n${w.trend?.text || ""} ${win ? `Best window: ${win.start}–${win.end} on ${win.date}.` : "No calm daylight window in the next 2 days."}\nOpen Sea forecast for the full hourly details.`;
      } catch { return "Oops, I couldn't reach the weather service just now 😕 Try again in a minute, or open the Sea forecast page."; }
    }
    const found = FAQ.find((item) => item.keys.some((key) => q.includes(key)));
    return found?.answer || "Hmm, not sure I got that 😅 I can help with the sea forecast, trip plans, buying or selling fish, harbor prices and emergency numbers. Try one of the quick buttons below!";
  }

  const send = async (value) => {
    const question = value.trim();
    if (!question || busy) return;
    setMessages((old) => [...old, { from: "user", text: question }]);
    setDraft(""); setBusy(true);
    const text = await answerFor(question);
    setMessages((old) => [...old, { from: "bot", text }]);
    setBusy(false);
  };

  return (
    <>
      {open && <section className="chat-panel" role="dialog" aria-label="Meen, Kadal Connect chat buddy">
        <header className="chat-head"><div className="chat-title"><span className="chat-avatar"><BotLogo size={26} /></span><div><strong>Meen · Kadal buddy</strong><small>Sea updates · Fish · Help</small></div></div>
          <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat"><Icon name="x" size={18} /></button></header>
        <div className="chat-messages" aria-live="polite">
          {messages.map((m, i) => <div key={i} className={`chat-msg ${m.from}`}>{m.text}</div>)}
          {busy && <div className="chat-msg bot typing">Typing…</div>}
        </div>
        <div className="chat-quick">{QUICK.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>
        <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask me anything, or just say hi…" aria-label="Type your question" />
          <button type="submit" aria-label="Send message"><Icon name="arrow-right" size={18} /></button>
        </form>
        <div className="chat-note">Automated guidance only. In an emergency call 112 or 1554.</div>
      </section>}
      <button className="chat-launch" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close help chat" : "Open help chat"} aria-expanded={open}>
        {open ? <Icon name="x" size={24} /> : <BotLogo size={30} />}
      </button>
    </>
  );
}
