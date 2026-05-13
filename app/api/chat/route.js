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
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found in response");
    const parsed = JSON.parse(match[0]);

    return Response.json({ content: [{ text: JSON.stringify(parsed) }] });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}