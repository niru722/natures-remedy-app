"use client";

import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are a knowledgeable natural wellness advisor specializing in supplements and natural remedies. Your role is to suggest evidence-based supplements and natural remedies based on symptoms described by users.

For each response:
1. Acknowledge the symptoms with empathy
2. Suggest 3-5 relevant supplements or natural remedies
3. For each supplement include:
   - Name and why it helps
   - Suggested dosage range
   - Natural food sources
   - Any important safety notes or interactions to be aware of

Format your response as JSON with this exact structure:
{
  "message": "A warm, empathetic opening message acknowledging their symptoms",
  "remedies": [
    {
      "name": "Supplement Name",
      "emoji": "relevant emoji",
      "benefit": "Why this helps for their specific symptoms",
      "dosage": "Typical dosage range",
      "foodSources": "Natural food sources",
      "safety": "Safety notes or who should avoid it"
    }
  ],
  "disclaimer": "Always end with a note to consult a healthcare professional before starting supplements"
}

Only return valid JSON, no markdown, no preamble.`;

const FOLLOW_UP_PROMPT = `You are a natural wellness advisor. The user has follow-up questions or wants to refine their supplement recommendations. 

Respond naturally in JSON:
{
  "message": "Your conversational response",
  "remedies": [] 
}

If they describe new or additional symptoms, include new remedies in the array using the same structure as before. Otherwise keep remedies empty.
Only return valid JSON.`;

export default function SupplementAdvisor() {
  const [step, setStep] = useState("intro");
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [diet, setDiet] = useState("");
  const [conditions, setConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function getRecommendations() {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError("");

    const userMessage = `Symptoms: ${symptoms}${age ? `\nAge: ${age}` : ""}${diet ? `\nDiet: ${diet}` : ""}${conditions ? `\nExisting conditions: ${conditions}` : ""}`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(i => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setChatMessages([{ role: "assistant", content: parsed.message, remedies: parsed.remedies }]);
      setStep("results");
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    const history = chatMessages.map(m => ({
      role: m.role,
      content: m.role === "assistant"
        ? `${m.content}${m.remedies?.length ? " [Remedies provided: " + m.remedies.map(r => r.name).join(", ") + "]" : ""}`
        : m.content
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: FOLLOW_UP_PROMPT,
          messages: [...history, { role: "user", content: userMsg }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(i => i.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setChatMessages(prev => [...prev, { role: "assistant", content: parsed.message, remedies: parsed.remedies }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, I had trouble with that. Please try again.", remedies: [] }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1a0f 0%, #0a1f10 40%, #071510 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#e8f0e0",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,124,52,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(44,95,30,0.12) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "60%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,180,80,0.08) 0%, transparent 70%)" }} />
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", position: "relative" }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
          <h1 style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: "normal",
            letterSpacing: "0.05em",
            color: "#a8d88a",
            margin: "0 0 8px",
            textShadow: "0 0 40px rgba(120,180,80,0.3)",
          }}>
            Nature's Remedy
          </h1>
          <p style={{ color: "#6a9a54", fontSize: 15, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
            Natural Supplement Advisor
          </p>
        </div>

        {step === "intro" && (
          <div style={{ textAlign: "center" }}>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(120,180,80,0.2)",
              borderRadius: 24,
              padding: "48px 40px",
              marginBottom: 32,
            }}>
              <p style={{ fontSize: 18, lineHeight: 1.8, color: "#b8d4a0", marginBottom: 32 }}>
                Describe your symptoms and get personalized natural supplement recommendations — evidence-based, holistic, and tailored to you.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 40 }}>
                {["🌙 Better Sleep", "⚡ More Energy", "🧠 Mental Clarity", "💪 Joint Health", "😌 Stress Relief"].map(tag => (
                  <span key={tag} style={{ color: "#7ab85c", fontSize: 14, letterSpacing: "0.05em" }}>{tag}</span>
                ))}
              </div>
              <button
                onClick={() => setStep("form")}
                style={{
                  background: "linear-gradient(135deg, #4a7c34, #2d5c1e)",
                  color: "#d4f0b8",
                  border: "none",
                  borderRadius: 50,
                  padding: "16px 48px",
                  fontSize: 16,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(74,124,52,0.4)",
                  transition: "all 0.3s",
                }}
                onMouseOver={e => e.target.style.transform = "translateY(-2px)"}
                onMouseOut={e => e.target.style.transform = "translateY(0)"}
              >
                Get My Recommendations →
              </button>
            </div>
            <p style={{ color: "#4a6e38", fontSize: 13, fontStyle: "italic" }}>
              Not medical advice. Always consult a healthcare professional before starting supplements.
            </p>
          </div>
        )}

        {step === "form" && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(120,180,80,0.2)",
            borderRadius: 24,
            padding: "40px",
          }}>
            <h2 style={{ color: "#a8d88a", fontWeight: "normal", marginBottom: 32, fontSize: 22 }}>Tell us about yourself</h2>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", color: "#7ab85c", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                What symptoms are you experiencing? *
              </label>
              <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="e.g. I've been feeling fatigued, having trouble sleeping, and experiencing brain fog..."
                rows={4}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(120,180,80,0.25)",
                  borderRadius: 12,
                  padding: "16px",
                  color: "#d4eabc",
                  fontSize: 15,
                  lineHeight: 1.7,
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", color: "#7ab85c", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                  Age (optional)
                </label>
                <input
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 34"
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(120,180,80,0.25)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    color: "#d4eabc",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#7ab85c", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                  Diet (optional)
                </label>
                <input
                  value={diet}
                  onChange={e => setDiet(e.target.value)}
                  placeholder="e.g. vegan, omnivore..."
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(120,180,80,0.25)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    color: "#d4eabc",
                    fontSize: 15,
                    outline: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={{ display: "block", color: "#7ab85c", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                Any existing conditions or medications? (optional)
              </label>
              <input
                value={conditions}
                onChange={e => setConditions(e.target.value)}
                placeholder="e.g. thyroid condition, taking blood thinners..."
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(120,180,80,0.25)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  color: "#d4eabc",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {error && <p style={{ color: "#e08070", marginBottom: 16 }}>{error}</p>}

            <div style={{ display: "flex", gap: 16 }}>
              <button
                onClick={() => setStep("intro")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(120,180,80,0.3)",
                  borderRadius: 50,
                  padding: "14px 32px",
                  color: "#6a9a54",
                  fontSize: 15,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ← Back
              </button>
              <button
                onClick={getRecommendations}
                disabled={loading || !symptoms.trim()}
                style={{
                  flex: 1,
                  background: symptoms.trim() ? "linear-gradient(135deg, #4a7c34, #2d5c1e)" : "rgba(74,124,52,0.2)",
                  color: symptoms.trim() ? "#d4f0b8" : "#4a6e38",
                  border: "none",
                  borderRadius: 50,
                  padding: "14px 32px",
                  fontSize: 16,
                  letterSpacing: "0.06em",
                  cursor: symptoms.trim() ? "pointer" : "not-allowed",
                  boxShadow: symptoms.trim() ? "0 8px 32px rgba(74,124,52,0.35)" : "none",
                  fontFamily: "inherit",
                  transition: "all 0.3s",
                }}
              >
                {loading ? "Finding remedies..." : "Find My Remedies 🌿"}
              </button>
            </div>
          </div>
        )}

        {step === "results" && result && (
          <div>
            <div style={{
              background: "rgba(74,124,52,0.1)",
              border: "1px solid rgba(120,180,80,0.25)",
              borderRadius: 20,
              padding: "28px 32px",
              marginBottom: 32,
            }}>
              <p style={{ color: "#b8d4a0", fontSize: 16, lineHeight: 1.8, margin: 0 }}>{result.message}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
              {result.remedies?.map((remedy, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(120,180,80,0.18)",
                  borderRadius: 20,
                  padding: "28px 32px",
                  transition: "border-color 0.3s",
                }}
                  onMouseOver={e => e.currentTarget.style.borderColor = "rgba(120,180,80,0.45)"}
                  onMouseOut={e => e.currentTarget.style.borderColor = "rgba(120,180,80,0.18)"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{remedy.emoji}</span>
                    <h3 style={{ margin: 0, color: "#a8d88a", fontWeight: "normal", fontSize: 20 }}>{remedy.name}</h3>
                  </div>
                  <p style={{ color: "#b0cc98", lineHeight: 1.7, marginBottom: 16, fontSize: 15 }}>{remedy.benefit}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div style={{ background: "rgba(74,124,52,0.1)", borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ color: "#6a9a54", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Dosage</div>
                      <div style={{ color: "#c0daa8", fontSize: 14 }}>{remedy.dosage}</div>
                    </div>
                    <div style={{ background: "rgba(74,124,52,0.1)", borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ color: "#6a9a54", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Food Sources</div>
                      <div style={{ color: "#c0daa8", fontSize: 14 }}>{remedy.foodSources}</div>
                    </div>
                  </div>
                  {remedy.safety && (
                    <div style={{ marginTop: 12, background: "rgba(200,150,50,0.08)", border: "1px solid rgba(200,150,50,0.15)", borderRadius: 10, padding: "10px 16px" }}>
                      <span style={{ color: "#c8a84a", fontSize: 12, letterSpacing: "0.05em" }}>⚠️ {remedy.safety}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <p style={{ color: "#4a6e38", fontSize: 13, fontStyle: "italic" }}>{result.disclaimer}</p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(120,180,80,0.2)",
              borderRadius: 20,
              overflow: "hidden",
              marginBottom: 24,
            }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(120,180,80,0.12)" }}>
                <h3 style={{ margin: 0, color: "#7ab85c", fontWeight: "normal", fontSize: 16 }}>
                  💬 Have questions? Ask me anything about these remedies
                </h3>
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", padding: "20px 24px" }}>
                {chatMessages.slice(1).map((msg, i) => (
                  <div key={i} style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "80%",
                      background: msg.role === "user" ? "rgba(74,124,52,0.3)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${msg.role === "user" ? "rgba(120,180,80,0.3)" : "rgba(120,180,80,0.12)"}`,
                      borderRadius: 14,
                      padding: "12px 16px",
                      color: "#c0daa8",
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}>
                      {msg.content}
                      {msg.remedies?.length > 0 && msg.remedies.map((r, j) => (
                        <div key={j} style={{ marginTop: 12, background: "rgba(74,124,52,0.1)", borderRadius: 10, padding: "10px 14px" }}>
                          <strong style={{ color: "#a8d88a" }}>{r.emoji} {r.name}</strong>
                          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#b0cc98" }}>{r.benefit}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ color: "#6a9a54", fontSize: 14, fontStyle: "italic" }}>Finding answer...</div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(120,180,80,0.12)", display: "flex", gap: 12 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Ask about dosage, interactions, alternatives..."
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(120,180,80,0.2)",
                    borderRadius: 50,
                    padding: "12px 20px",
                    color: "#d4eabc",
                    fontSize: 14,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={sendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  style={{
                    background: "linear-gradient(135deg, #4a7c34, #2d5c1e)",
                    border: "none",
                    borderRadius: 50,
                    padding: "12px 24px",
                    color: "#d4f0b8",
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Ask →
                </button>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => { setStep("intro"); setResult(null); setSymptoms(""); setAge(""); setDiet(""); setConditions(""); setChatMessages([]); }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(120,180,80,0.25)",
                  borderRadius: 50,
                  padding: "12px 32px",
                  color: "#6a9a54",
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ← Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}