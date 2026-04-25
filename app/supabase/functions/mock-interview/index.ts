import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LLM7_API_KEY = Deno.env.get('LLM7_API_KEY')
    const LLM7_API_URL = "https://api.llm7.io/v1/chat/completions"

    if (!LLM7_API_KEY) {
      throw new Error("LLM7_API_KEY is not set")
    }

    const { role, jobDescription, messages, bank_context } = await req.json()

    const systemPrompt = `You are a world-class technical interviewer for the role of ${role}.
    Your goal is to conduct a realistic mock interview.
    
    Context:
    - Job Description: ${jobDescription}
    - User's Past Questions: ${bank_context || 'None provided.'}
    
    Instructions:
    1. If this is the start of the interview, introduce yourself and ask the first question.
    2. If the user provided an answer, give a very brief and professional evaluation (1-2 sentences) and then ask the next question.
    3. Keep your questions challenging but relevant to the Role and Job Description.
    4. Ask only ONE question at a time.
    5. Stay in character as a professional interviewer.
    `

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
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LLM API Error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
