import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, system } = body;

    const response = await client.messages.create({
      model:"claude-sonnet-4-6",
      max_tokens: 1000,
      system: system,
      messages: messages,
    });

    return Response.json(response);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}