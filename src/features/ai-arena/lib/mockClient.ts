import { Message } from "../types/chat";

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * sendMessageMock simulates a backend LLM response.
 * Replace with a real HTTP call later (keep same signature).
 */
export async function sendMessageMock(messages: Message[]): Promise<Message> {
  await sleep(500);
  const lastUser = [...messages].reverse().find(m => m.role === "user");

  const canned =
`To troubleshoot this issue:
• Check the system logs in transaction SM21
• Verify user authorizations in SU53
• Review the configuration in SPRO

Let me know if you need more specific guidance!`;

  const content = lastUser
    ? (lastUser.content.toLowerCase().includes("code")
        ? `Here's a code example that should work:

\`\`\`python
def process_sap_data(data):
    # Process the incoming data
    result = []
    for item in data:
        if item.get('status') == 'active':
            result.append(item)
    return result
\`\`\`

You can adjust this based on your specific requirements.`
        : canned)
    : canned;

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content,
    createdAt: Date.now()
  };
}