const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

export async function callClaude(
  prompt: string,
  maxTokens = 100,
): Promise<string> {
  if (!API_KEY) return ''
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text ?? ''
  } catch {
    return ''
  }
}
