import { useEffect, useState, useRef } from "react";
import { ChatCircleDots, X, PaperPlaneRight } from "@phosphor-icons/react";
import api from "@/lib/api";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "bot", text: "Hi! I'm CarpetAdda Concierge. Ask me about properties, projects, locations or the buying process." }]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef();

  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs, open]);

  const send = async (e) => {
    e.preventDefault();
    if (!q.trim() || loading) return;
    const userMsg = q; setQ("");
    setMsgs(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { query: userMsg });
      setMsgs(m => [...m, { role: "bot", text: data.reply }]);
    } catch { setMsgs(m => [...m, { role: "bot", text: "Sorry, I'm having trouble. Please try again." }]); }
    finally { setLoading(false); }
  };

  return (
    <>
      <button data-testid="chat-toggle" onClick={() => setOpen(o => !o)} aria-label="Chat" className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all">
        {open ? <X size={22} weight="bold" /> : <ChatCircleDots size={24} weight="fill" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col" style={{ height: 480 }}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-4">
            <div className="text-xs uppercase tracking-widest text-blue-100 font-semibold">Concierge</div>
            <div className="text-lg font-semibold">CarpetAdda AI</div>
          </div>
          <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {msgs.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block max-w-[85%] px-3.5 py-2.5 rounded-2xl ${m.role === "user" ? "bg-blue-600 text-white rounded-br-md" : "bg-white text-slate-800 border border-slate-200 rounded-bl-md"}`}>{m.text}</div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-500 italic">Thinking…</div>}
          </div>
          <form onSubmit={send} className="p-3 border-t border-slate-200 flex gap-2 bg-white">
            <input data-testid="chat-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Ask anything…" className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <button data-testid="chat-send" className="px-3.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"><PaperPlaneRight size={16} weight="fill" /></button>
          </form>
        </div>
      )}
    </>
  );
}
