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

    const systemPrompt = `You are a world-class technical interviewer for the role of: "${role}".
    
    CRITICAL PRIORITY:
    1. Your primary focus must be the specific responsibilities and expertise required for a ${role}. 
    2. If a Job Description is provided below, strictly follow its requirements.
    3. Use the "User's Past Questions" only as a reference for topics they've encountered. ONLY ask questions from that list IF they are highly relevant to being a ${role}. For example, if the role is "Web Dev" and a past question is about "Network Security", IGNORE that past question.
    
    Context:
    - Target Role: ${role}
    - Job Description: ${jobDescription || 'Not provided. Use general industry standards for this role.'}
    - User's Past Questions (Reference Only): ${bank_context || 'None.'}
    
    Instructions:
    1. Introduction: If this is the start (messages array is empty), introduce yourself briefly as an interviewer from a top tech company and ask an open-ended technical or behavioral question appropriate for a ${role}.
    2. Evaluation: If the user answers, give a concise, expert critique (strengths/weaknesses) before moving on.
    3. Progression: Gradually increase difficulty. Start with fundamentals, then move to specific scenarios, system design, or tricky edge cases for a ${role}.
    4. Limitation: Ask only ONE clear question at a time. Stay in character. Do not be repetitive.
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
