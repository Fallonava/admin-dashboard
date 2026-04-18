import { useState, useRef, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseStreamChatOptions {
  api: string;
  body?: Record<string, unknown>;
  initialMessages?: ChatMessage[];
  onError?: (err: Error) => void;
}

/**
 * Custom streaming chat hook compatible with AI SDK v6.
 * Uses native fetch + ReadableStream — no SDK dependency on the client.
 * Backend must return a plain text stream (result.toTextStreamResponse()).
 */
export function useStreamChat({
  api,
  body = {},
  initialMessages = [],
  onError,
}: UseStreamChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const append = useCallback(async (userMessage: Pick<ChatMessage, 'role' | 'content'>) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage.content,
    };

    // Rekam context history dari pesan sebelumnya
    const historyPayload = messages.slice(-6).map(m => ({
      sender: m.role === 'user' ? 'user' : 'ai',
      text: m.content,
    }));

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const assistantId = `ai-${Date.now()}`;
    // Tambahkan placeholder pesan AI (kosong, akan diisi lewat stream)
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      abortRef.current = new AbortController();

      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: historyPayload,
          ...body,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.reply || errData.error || `HTTP ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';

      // === Mode Streaming (Ollama aktif) ===
      if (res.body && (contentType.includes('text/plain') || contentType.includes('text/event-stream'))) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Filter SSE prefix jika ada (e.g. "0:\"text\"" format AI SDK data stream)
          const text = chunk
            .split('\n')
            .map(line => {
              // Format SSE data stream: `0:"chunk text"` → ambil teks asli
              const match = line.match(/^0:"(.*)"$/);
              if (match) {
                try { return JSON.parse(`"${match[1]}"`); } catch { return match[1]; }
              }
              // Plain text line
              if (line.startsWith('data:')) return line.slice(5).trim();
              return line;
            })
            .filter(Boolean)
            .join('');

          if (text) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + text } : m
              )
            );
          }
        }

      // === Mode Fallback (Ollama mati → JSON response) ===
      } else {
        const data = await res.json();
        const replyText = data.reply || data.content || 'Maaf, tidak ada respons.';
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: replyText } : m)
        );
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return;

      const errorMessage = '❌ Koneksi ke AI terputus. Sistem berjalan dalam mode offline.';
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, content: errorMessage } : m)
      );
      onError?.(err instanceof Error ? err : new Error(String(err)));

    } finally {
      setIsLoading(false);
    }
  }, [api, body, messages, onError]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    append({ role: 'user', content: msg });
  }, [input, isLoading, append]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    append,
    handleSubmit,
    handleInputChange,
    stop,
  };
}
