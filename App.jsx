import { useState, useEffect, useRef, useMemo } from "react";
import { Database, Send, History, Trash2, Copy, Check, Loader2, AlertCircle, HelpCircle, Search, ChevronDown } from "lucide-react";
import { SCHEMAS } from "./schemas.js";

const LS_SCHEMA = "bhasha-sql-schema";
const LS_ACTIVE_DB = "bhasha-sql-active-db";
const LS_HISTORY = "bhasha-sql-history";

export default function App() {
  const [schema, setSchema] = useState(() => localStorage.getItem(LS_SCHEMA) || SCHEMAS[0].sql);
  const [activeDbName, setActiveDbName] = useState(() => localStorage.getItem(LS_ACTIVE_DB) || SCHEMAS[0].name);
  const [schemaOpen, setSchemaOpen] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(LS_SCHEMA, schema);
  }, [schema]);

  useEffect(() => {
    localStorage.setItem(LS_ACTIVE_DB, activeDbName);
  }, [activeDbName]);

  useEffect(() => {
    localStorage.setItem(LS_HISTORY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const filteredSchemas = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return SCHEMAS;
    return SCHEMAS.filter((s) => s.name.toLowerCase().includes(q));
  }, [pickerQuery]);

  function selectDatabase(entry) {
    setSchema(entry.sql);
    setActiveDbName(entry.name);
    setPickerOpen(false);
    setPickerQuery("");
    setSchemaOpen(true);
  }

  async function handleAsk() {
    const q = question.trim();
    if (!q || loading) return;
    setQuestion("");
    setLoading(true);

    const entry = {
      id: Date.now().toString(),
      question: q,
      dbName: activeDbName,
      sql: "",
      explanation: "",
      queryType: "",
      confidence: "",
      clarification: "",
      error: "",
    };

    try {
      const response = await fetch("/api/generate-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, schema }),
      });
      const data = await response.json();
      if (!response.ok) {
        entry.error = data.error || "Something went wrong.";
      } else {
        entry.sql = data.sql || "";
        entry.explanation = data.explanation || "";
        entry.queryType = data.queryType || "";
        entry.confidence = data.confidence || "";
        entry.clarification = data.clarification || "";
        entry.error = data.error || "";
      }
    } catch (e) {
      entry.error = "Could not reach the backend server. Is `npm run server` running?";
    }

    setMessages((prev) => [...prev, entry]);
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  async function handleCopy(sql, id) {
    try {
      await navigator.clipboard.writeText(sql);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (e) {}
  }

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(LS_HISTORY);
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#0F1720", minHeight: "100vh", color: "#E5EDF5", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; font-family: 'Inter', system-ui, sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        textarea, input { outline: none; }
        ::placeholder { color: #4F6273; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #223140; border-radius: 4px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; }
      `}</style>

      <div style={{ borderBottom: "1px solid #1D2A38", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#16212C", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #223140" }}>
          <Database size={17} color="#38BDF8" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Bhasha SQL</div>
          <div style={{ fontSize: 11.5, color: "#7C93A8" }}>Ask in any language · {SCHEMAS.length} ready-made databases</div>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ width: 310, borderRight: "1px solid #1D2A38", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: 14, borderBottom: "1px solid #1D2A38", position: "relative" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#A8BCCE", letterSpacing: 0.3, marginBottom: 8 }}>DATABASE</div>
            <div
              onClick={() => setPickerOpen((v) => !v)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#0B1017",
                border: "1px solid #223140",
                borderRadius: 8,
                padding: "9px 12px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13, color: "#CBE3F5" }}>{activeDbName}</span>
              <ChevronDown size={15} color="#7C93A8" />
            </div>

            {pickerOpen && (
              <div style={{ position: "absolute", top: 68, left: 14, right: 14, zIndex: 10, background: "#16212C", border: "1px solid #223140", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", maxHeight: 340, display: "flex", flexDirection: "column" }}>
                <div style={{ padding: 8, borderBottom: "1px solid #223140", display: "flex", alignItems: "center", gap: 6 }}>
                  <Search size={14} color="#7C93A8" />
                  <input
                    autoFocus
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder={`Search ${SCHEMAS.length} databases...`}
                    style={{ flex: 1, background: "transparent", border: "none", color: "#E5EDF5", fontSize: 12.5 }}
                  />
                </div>
                <div style={{ overflowY: "auto" }}>
                  {filteredSchemas.length === 0 && (
                    <div style={{ padding: 12, fontSize: 12, color: "#5C7286" }}>No match.</div>
                  )}
                  {filteredSchemas.map((s) => (
                    <div
                      key={s.name}
                      onClick={() => selectDatabase(s)}
                      style={{ padding: "8px 12px", fontSize: 12.5, cursor: "pointer", color: s.name === activeDbName ? "#38BDF8" : "#CBD8E3" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1B2A38")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              onClick={() => setSchemaOpen((v) => !v)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginTop: 12, marginBottom: schemaOpen ? 8 : 0 }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#7C93A8", letterSpacing: 0.3 }}>SCHEMA (editable)</span>
              <span style={{ fontSize: 11, color: "#5C7286" }}>{schemaOpen ? "hide" : "show"}</span>
            </div>
            {schemaOpen && (
              <textarea
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
                rows={11}
                className="mono"
                style={{
                  width: "100%",
                  background: "#0B1017",
                  border: "1px solid #223140",
                  borderRadius: 8,
                  color: "#CBE3F5",
                  fontSize: 12,
                  padding: 10,
                  resize: "vertical",
                  lineHeight: 1.5,
                }}
                placeholder="Paste your own CREATE TABLE schema here..."
              />
            )}
          </div>

          <div style={{ padding: "12px 14px", borderBottom: "1px solid #1D2A38", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#A8BCCE" }}>
              <History size={14} /> HISTORY
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                style={{ background: "none", border: "none", color: "#7C93A8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}
              >
                <Trash2 size={12} /> clear
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
            {messages.length === 0 && (
              <div style={{ color: "#5C7286", fontSize: 12, padding: 10 }}>No queries yet. Ask something below.</div>
            )}
            {messages.slice().reverse().map((m) => (
              <div
                key={m.id}
                onClick={() => document.getElementById(`msg-${m.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                style={{ padding: "8px 10px", borderRadius: 6, cursor: "pointer", marginBottom: 3 }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#16212C")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontSize: 12.5, color: "#CBD8E3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.question}</div>
                <div style={{ fontSize: 10.5, color: "#5C7286", marginTop: 1 }}>{m.dbName}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {messages.length === 0 && !loading && (
              <div style={{ color: "#5C7286", fontSize: 13.5, marginTop: 40, textAlign: "center" }}>
                Pick a database on the left (or paste your own schema), then type a question in any language and press Enter.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} id={`msg-${m.id}`} style={{ marginBottom: 22, maxWidth: 640 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <div style={{ background: "#1B2A38", padding: "8px 14px", borderRadius: "12px 12px 2px 12px", fontSize: 13.5, color: "#E5EDF5" }}>
                    {m.question}
                  </div>
                </div>

                <div style={{ background: "#16212C", border: "1px solid #223140", borderRadius: "2px 12px 12px 12px", padding: 14 }}>
                  <div style={{ fontSize: 10.5, color: "#5C7286", marginBottom: 8 }}>Database: {m.dbName}</div>
                  {m.clarification && (
                    <div style={{ display: "flex", gap: 8, color: "#F5A524", fontSize: 13 }}>
                      <HelpCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{m.clarification}</span>
                    </div>
                  )}
                  {m.error && (
                    <div style={{ display: "flex", gap: 8, color: "#F87171", fontSize: 13 }}>
                      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{m.error}</span>
                    </div>
                  )}
                  {m.sql && (
                    <>
                      <div style={{ position: "relative", marginBottom: 10 }}>
                        <pre className="mono" style={{ background: "#0B1017", border: "1px solid #223140", borderRadius: 8, padding: "10px 40px 10px 12px", fontSize: 12.5, color: "#7ED6A5", overflowX: "auto", margin: 0, lineHeight: 1.6 }}>
{m.sql}
                        </pre>
                        <button
                          onClick={() => handleCopy(m.sql, m.id)}
                          style={{ position: "absolute", top: 8, right: 8, background: "#16212C", border: "1px solid #223140", borderRadius: 6, padding: 5, cursor: "pointer", color: "#A8BCCE" }}
                          title="Copy SQL"
                        >
                          {copiedId === m.id ? <Check size={13} color="#7ED6A5" /> : <Copy size={13} />}
                        </button>
                      </div>
                      {m.explanation && <div style={{ fontSize: 13, color: "#B7C7D6", lineHeight: 1.55, marginBottom: 8 }}>{m.explanation}</div>}
                      <div style={{ display: "flex", gap: 8 }}>
                        {m.queryType && (
                          <span style={{ fontSize: 11, background: "#0F2B3D", color: "#38BDF8", padding: "3px 9px", borderRadius: 20 }}>{m.queryType}</span>
                        )}
                        {m.confidence && (
                          <span style={{ fontSize: 11, background: "#1A2E1E", color: "#7ED6A5", padding: "3px 9px", borderRadius: 20 }}>{m.confidence} confidence</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#7C93A8", fontSize: 13 }}>
                <Loader2 size={15} className="mono" style={{ animation: "spin 1s linear infinite" }} />
                Generating SQL...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ borderTop: "1px solid #1D2A38", padding: 14, display: "flex", gap: 10 }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask in any language... (Enter to send, Shift+Enter for new line)"
              style={{
                flex: 1,
                background: "#16212C",
                border: "1px solid #223140",
                borderRadius: 10,
                color: "#E5EDF5",
                fontSize: 13.5,
                padding: "10px 14px",
                resize: "none",
              }}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              style={{
                background: loading || !question.trim() ? "#16212C" : "#38BDF8",
                border: "none",
                borderRadius: 10,
                width: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: loading || !question.trim() ? "default" : "pointer",
                color: loading || !question.trim() ? "#5C7286" : "#0B1017",
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
