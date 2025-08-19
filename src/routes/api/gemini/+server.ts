import { json } from "@sveltejs/kit";
import { askGemini } from "$lib/server/gemini";

export async function POST({ request }) {
  const { prompt } = await request.json();
  const response = await askGemini(prompt);
  return json({ response });
}
