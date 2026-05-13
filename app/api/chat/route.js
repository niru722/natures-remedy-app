import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, system } = body;

    const enhancedSystem = system + "\n\nCRITICAL: Your entire response must be ONLY a valid JSON object. No text before or after. No markdown. No explanation. Start with { and end with }. Nothing else.";

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: enhancedSystem,
      messages: messages,
    });

    const text = response.content.map(i => i.text || "").join("");
    
    // Try multiple parsing strategies
    let parsed;
    try {
      // Strategy 1: direct parse
      parsed = JSON.parse(text.trim());
    } catch {
      try {
        // Strategy 2: extract JSON block
        const match = text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch {
        // Strategy 3: clean and parse
        const cleaned = text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
          .trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }
    }

    if (!parsed) throw new Error("Could not parse response");

    return Response.json({ content: [{ text: JSON.stringify(parsed) }] });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}