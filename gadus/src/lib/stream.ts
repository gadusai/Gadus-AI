export async function streamChat({
  conversationId,
  content,
  onToken,
  onComplete,
  onError,
  signal,
}: {
  conversationId: number;
  content: string;
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: any) => void;
  signal?: AbortSignal;
}) {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/$/, "")}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, content }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Failed to stream: ${res.statusText}`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    let textBuffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onComplete();
        break;
      }

      textBuffer += decoder.decode(value, { stream: true });
      const lines = textBuffer.split("\n");
      textBuffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim().startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") continue;
          
          try {
            const data = JSON.parse(dataStr);
            if (data.done) {
              onComplete();
            } else if (data.token) {
              onToken(data.token);
            }
          } catch (e) {
            // Wait for more data
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      onComplete();
    } else {
      onError(err);
    }
  }
}
