import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 1. Log immediately
  console.log(`Incoming request: ${req.method} ${req.url}`)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LLM7_API_KEY = Deno.env.get('LLM7_API_KEY')
    const LLM7_API_URL = "https://api.llm7.io/v1/chat/completions"

    if (!LLM7_API_KEY) {
      console.error("Critical Error: LLM7_API_KEY is not set in Supabase Secrets.")
      return new Response(
        JSON.stringify({ error: "API Key missing in backend secrets." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Safely parse JSON
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { question, user_answer } = body;
    console.log(`Processing question: "${question?.slice(0, 50)}..."`)

    const systemPrompt = `You are an expert technical interviewer. Respond ONLY with a JSON object: {"feedback": "...", "ideal_answer": "..."}`

    const response = await fetch(LLM7_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LLM7_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'default',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Question: ${question}\nAnswer: ${user_answer || "N/A"}` }
        ],
        temperature: 0.7
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LLM7 API Error (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: `LLM API Error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Clean up LLM response if it's wrapped in code blocks
    const cleaned = content.replace(/```json|```/g, '').trim();
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch (e) {
      console.warn("LLM didn't return perfect JSON, returning raw text.");
      result = { feedback: content, ideal_answer: "Refer to official documentation." };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Unexpected Edge Function Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
