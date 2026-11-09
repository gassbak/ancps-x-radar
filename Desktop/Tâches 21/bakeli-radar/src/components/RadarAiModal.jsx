import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, MapPin, Building2, Briefcase, Clock, GraduationCap, ExternalLink, Target, Award, Timer } from 'lucide-react';
import { apiService } from '../services/api';

function parseOffers(text) {
  if (!text.includes('📌') || !text.includes('offres trouvées')) return null;
  try {
    const headerMatch = text.match(/🎯\s*\*\*(.*?)\*\*\s*pour\s*«(.*?)»/);
    const header = headerMatch ? { count: headerMatch[1], term: headerMatch[2] } : null;
    const rawOffers = text.split('📌').slice(1);
    let offers = rawOffers.map(block => {
      const titleMatch = block.match(/\*\*(.*?)\*\*/);
      const title = titleMatch ? titleMatch[1].trim() : block.split('\n')[0].trim();
      const companyMatch = block.match(/🏢\s*(.*?)\s*•\s*📍\s*(.*)/);
      const contractMatch = block.match(/💰\s*(.*?)\s*•\s*⏳\s*(.*)/);
      const eduMatch = block.match(/🎓\s*(.*)/);
      const skillsMatch = block.match(/🔑\s*Compétences\s*:\s*(.*)/);
      const linkMatch = block.match(/🔗\s*(https?:\/\/\S+)/);
      const fallbackLink = !linkMatch ? block.match(/https?:\/\/\S+/) : null;
      return {
        title,
        company: companyMatch ? companyMatch[1].trim() : 'Entreprise',
        location: companyMatch ? companyMatch[2].trim() : 'Sénégal',
        contract: contractMatch ? contractMatch[1].trim() : '—',
        exp: contractMatch ? contractMatch[2].trim() : '—',
        education: eduMatch ? eduMatch[1].trim() : 'Non spécifié',
        skills: skillsMatch ? skillsMatch[1].trim() : 'Non précisées',
        link: (linkMatch ? linkMatch[1] : fallbackLink ? fallbackLink[0] : null)?.replace(/[*_]+$/, '').trim(),
      };
    }).filter(o => o.title);

    const seen = new Set();
    offers = offers.filter(o => {
      const key = `${o.title}|${o.company}|${o.link}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (offers.length === 0) return null;
    if (header) header.count = `${offers.length} offres trouvées`;
    return { header, offers };
  } catch { return null; }
}

function FormattedText({ text }) {
  const parsed = parseOffers(text);
  if (parsed) {
    return (
      <div className="flex flex-col gap-3 w-full">
        {parsed.header && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-extrabold tracking-wide">🎯 {parsed.header.count}</div>
              <div className="text-[11px] opacity-90">pour « {parsed.header.term} »</div>
            </div>
            <span className="px-2 py-1 bg-white text-emerald-700 rounded-full text-[10px] font-bold">{parsed.offers.length} résultats</span>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {parsed.offers.map((offer, idx) => (
            <div key={idx} className="group bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all">
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-extrabold text-gray-900 text-[13px] leading-tight flex-1">{offer.title}</h4>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 border ${
                    offer.contract.toLowerCase().includes('stage') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    offer.contract.toLowerCase().includes('emploi') || offer.contract.toLowerCase().includes('cdi') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>{offer.contract}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-full text-[11px] font-medium text-gray-700">
                    <Building2 className="w-3 h-3 text-emerald-600" />{offer.company}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[11px] font-medium text-emerald-700">
                    <MapPin className="w-3 h-3" />{offer.location}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1.5 rounded-xl"><Clock className="w-3.5 h-3.5 text-gray-400" />{offer.exp}</span>
                  <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-1.5 rounded-xl"><GraduationCap className="w-3.5 h-3.5 text-gray-400" />{offer.education}</span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px] leading-relaxed bg-amber-50/50 border border-amber-100 rounded-xl px-2.5 py-2">
                  <Award className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-gray-700"><span className="font-bold text-amber-800">Compétences:</span> {offer.skills}</span>
                </div>
                {offer.link && (
                  <a href={offer.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all">
                    <ExternalLink className="w-3.5 h-3.5" /> Voir l'offre & candidater
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-700">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-extrabold text-emerald-800">{part.slice(2, -2)}</strong>;
        }
        const withLinks = part.split(/(https?:\/\/\S+)/g);
        return (
          <span key={i}>
            {withLinks.map((p, j) => p.match(/^https?:\/\//) ? (
              <a key={j} href={p} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline underline-offset-2 break-all">{p}</a>
            ) : p)}
          </span>
        );
      })}
    </div>
  );
}

export const RadarAiModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Bonjour ! Je suis le Radar AI. Je peux t'aider à trouver le stage, l'emploi ou la bourse idéal(e) au Sénégal. Que recherches-tu aujourd'hui ?"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState(0);
  const [lastSentAt, setLastSentAt] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { if (isOpen) scrollToBottom(); }, [isOpen, messages]);
  useEffect(() => { scrollToBottom(); }, [loading, rateLimit]);

  useEffect(() => {
    if (rateLimit <= 0) return;
    const t = setInterval(() => setRateLimit(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [rateLimit]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || loading || rateLimit > 0) return;
    const now = Date.now();
    if (now - lastSentAt < 2000) return;
    setLastSentAt(now);
    const userMsg = inputVal.trim();
    setInputVal('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const history = [...messages, { sender:'user', text: userMsg }].map(m=>({
        role: m.sender==='user' ? 'user' : 'assistant',
        content: m.text
      }));
      const res = await apiService.sendAiMessage(userMsg, history);
      setMessages(prev => [...prev, { sender: 'ai', text: res.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      const msg = String(err.message || "");
      const is429 = err.status === 429 || msg.includes('RATE_LIMIT') || msg.includes('429');
      if (is429) {
        const retry = err.retryAfter || 20;
        setRateLimit(retry);
        setMessages(prev => [...prev, { sender: 'ai', text: `⏳ **Limite atteinte (429)** — Trop de requêtes en peu de temps. Réessaie dans ${retry} secondes ⏱️` }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: `😔 **Erreur temporaire** — ${msg.slice(0,100) || 'serveur indisponible'}.` }]);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed right-6 bottom-6 w-[380px] sm:w-[400px] h-[540px] rounded-3xl shadow-2xl z-50 bg-white flex flex-col border border-gray-100 overflow-hidden animate-fadeIn">
      
      {/* Header */}
      <div className="bg-emerald-700 text-white p-4 flex items-center justify-between relative shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-emerald-200 shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Radar AI Assistant</h3>
            <p className="text-[11px] text-emerald-200 font-medium">Toujours à l'écoute des opportunités</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-emerald-600/60 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50/50">
        {messages.map((msg, index) => {
          const isAi = msg.sender === 'ai';
          const isOfferMsg = isAi && msg.text.includes('📌') && msg.text.includes('offres trouvées');
          return (
            <div key={index} className={`flex items-start gap-2.5 ${isAi ? 'self-start w-full' : 'self-end max-w-[85%] flex-row-reverse'}`}>
              {isAi ? (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`${isAi ? (isOfferMsg ? 'flex-1 min-w-0' : 'max-w-[85%]') : 'max-w-full'} p-3 rounded-2xl text-xs sm:text-sm shadow-2xs ${
                isAi ? 'bg-white border border-gray-100 rounded-tl-sm' : 'bg-emerald-600 text-white rounded-tr-sm'
              }`}>
                {isAi && (
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> RADAR AI
                  </div>
                )}
                {isAi ? <FormattedText text={msg.text} /> : <span className="leading-relaxed">{msg.text}</span>}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-start gap-2.5 self-start">
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="px-3.5 py-2.5 bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-2xs flex items-center gap-2 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              <span className="ml-1">Recherche...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2 shrink-0">
        {rateLimit > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-semibold">Patiente {rateLimit}s</span>
          </div>
        )}
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            placeholder={rateLimit > 0 ? `Patiente ${rateLimit}s...` : "Ex: Stages en info à Dakar..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={rateLimit > 0}
            className="w-full pl-3.5 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:text-gray-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || loading || rateLimit > 0}
            className="absolute right-1 w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400">L'IA peut faire des erreurs. Vérifiez les infos officielles.</p>
      </div>

    </div>
  );
};
