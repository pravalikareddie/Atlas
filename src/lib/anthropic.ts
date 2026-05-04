const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

export interface ToolDef {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
}

export interface ChatResponse {
  text: string
  toolCalls: ToolCall[]
}

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
        model: 'claude-sonnet-4-6',
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

export async function callClaudeWithTools(
  messages: { role: string; content: string }[],
  system: string,
  tools: ToolDef[],
  maxTokens = 2048,
): Promise<ChatResponse> {
  if (!API_KEY) return { text: '', toolCalls: [] }
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
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        system,
        messages,
        tools,
      }),
    })
    const data = await res.json()
    let text = ''
    const toolCalls: ToolCall[] = []
    for (const block of data.content ?? []) {
      if (block.type === 'text') text += block.text
      if (block.type === 'tool_use') toolCalls.push({ name: block.name, input: block.input })
    }
    return { text, toolCalls }
  } catch {
    return { text: 'Something went wrong.', toolCalls: [] }
  }
}
