import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import MessageBubble from './MessageBubble';

export default function AgentChat({ agent }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        let conv = null;
        const list = await base44.agents.listConversations({ agent_name: agent.name });
        const items = list?.items || list || [];
        if (items.length) conv = items[0];
        else conv = await base44.agents.createConversation({ agent_name: agent.name, metadata: { name: agent.label } });
        if (cancelled) return;
        setConversation(conv);
        setMessages(conv.messages || []);
        unsub = base44.agents.subscribeToConversation(conv.id, (data) => {
          setMessages(data.messages || []);
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; unsub(); };
  }, [agent.name]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) { setPending(false); return; }
    if (last.role === 'user') { setPending(true); return; }
    const busy = last.tool_calls?.some((tc) => ['pending', 'running', 'in_progress'].includes(tc.status));
    setPending(!!busy || !last.content);
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || pending || !conversation) return;
    setInput('');
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
      setPending(true);
    } catch (e) {
      setError(e?.message || String(e));
      setInput(text);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin p-4 sm:p-6">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div>
            <div>
              <p className="font-medium">{agent.label}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{agent.description}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {agent.prompts.map((p) => (
                <button key={p} onClick={() => setInput(p)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 hover:bg-muted">{p}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={i} message={m} />)
        )}
        {error && <p className="text-center text-xs text-destructive">{error}</p>}
      </div>
      <div className="border-t border-border p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={`Message ${agent.label}…`}
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button onClick={send} disabled={pending || !input.trim()} size="icon" className="h-10 w-10 shrink-0">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}