import { useState } from 'react';
import { Send } from 'lucide-react';
import { SUGGESTED_QUESTIONS } from '../data/portfolio';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

export function AskTrinity() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      text: question,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Could not reach Trinity AI right now.');
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: data.answer,
        },
      ]);
    } catch {
      setError('Network error. Please try again or email mazinoishioma@gmail.com.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    askQuestion(input);
  };

  return (
    <section id="ask" className="py-16 sm:py-20" style={{ borderTop: '1px solid var(--border-hairline)' }}>
      <div className="max-w-3xl">
        <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--accent)' }}>
          Interactive Q&A
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Ask Trinity
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Ask anything about my work, enterprise experience, stack, or availability.
        </p>

        {/* Suggested question chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => askQuestion(q)}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-left theme-transition disabled:opacity-60"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Conversation Thread */}
        {messages.length > 0 && (
          <div
            className="mt-6 divide-y rounded-lg px-4 theme-transition"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-hairline)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            {messages.map((msg) => (
              <div key={msg.id} className="py-3.5" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[11px] font-medium block mb-1" style={{ color: msg.role === 'user' ? 'var(--text-muted)' : 'var(--accent)' }}>
                  {msg.role === 'user' ? 'You' : 'Trinity'}
                </span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {msg.text}
                </p>
              </div>
            ))}

            {loading && (
              <div className="py-3.5" style={{ borderColor: 'var(--border-hairline)' }}>
                <span className="text-[11px] font-medium block mb-1" style={{ color: 'var(--accent)' }}>
                  Trinity
                </span>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Thinking...
                </p>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs font-medium" role="alert" style={{ color: 'var(--accent)' }}>
            {error}
          </p>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
          <label htmlFor="ask-trinity-input" className="sr-only">
            Ask Trinity a question
          </label>
          <input
            id="ask-trinity-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about my enterprise experience, stack, or availability..."
            maxLength={500}
            className="flex-1 min-w-0 px-3.5 py-2.5 text-sm rounded-md theme-transition"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-strong)',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap shrink-0 theme-transition disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
}
