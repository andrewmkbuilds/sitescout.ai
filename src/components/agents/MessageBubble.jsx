import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronRight, Check, X, Loader2, Wrench } from 'lucide-react';

const STATUS_META = {
  pending: { icon: Loader2, className: 'animate-spin text-muted-foreground', label: 'Queued' },
  running: { icon: Loader2, className: 'animate-spin text-primary', label: 'Running' },
  in_progress: { icon: Loader2, className: 'animate-spin text-primary', label: 'Running' },
  completed: { icon: Check, className: 'text-emerald-500', label: 'Done' },
  success: { icon: Check, className: 'text-emerald-500', label: 'Done' },
  failed: { icon: X, className: 'text-destructive', label: 'Failed' },
  error: { icon: X, className: 'text-destructive', label: 'Error' },
};

function ToolCall({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const meta = STATUS_META[toolCall.status] || STATUS_META.pending;
  const Icon = meta.icon;
  const proj = toolCall.display_projection || {};
  const hidden = proj.hide_details && proj.details_redacted;
  let parsedArgs = toolCall.arguments_string;
  try { parsedArgs = JSON.parse(toolCall.arguments_string); } catch { /* keep raw */ }
  let parsedResults = toolCall.results;
  if (typeof parsedResults === 'string') {
    try { parsedResults = JSON.parse(parsedResults); } catch { /* keep raw */ }
  }
  const failed = ['failed', 'error'].includes(toolCall.status) ||
    (typeof parsedResults === 'string' && /error|failed/i.test(parsedResults)) ||
    (parsedResults && parsedResults.success === false);
  const label = hidden
    ? (['pending', 'running', 'in_progress'].includes(toolCall.status) ? proj.active_label
      : failed ? proj.error_label : proj.label) || meta.label
    : toolCall.name;

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/40 text-xs">
      <button
        onClick={() => !hidden && setExpanded((e) => !e)}
        className={`flex w-full items-center gap-2 px-3 py-2 ${hidden ? '' : 'hover:bg-muted/70'}`}
      >
        <Icon className={`h-3.5 w-3.5 shrink-0 ${failed ? 'text-destructive' : meta.className}`} />
        <span className="font-medium">{label}</span>
        {!hidden && <ChevronRight className={`ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />}
      </button>
      {expanded && !hidden && (
        <div className="space-y-2 border-t border-border px-3 py-2 font-mono text-[11px] leading-relaxed">
          {parsedArgs !== undefined && (
            <div>
              <div className="mb-0.5 text-muted-foreground">Parameters</div>
              <pre className="whitespace-pre-wrap break-words text-foreground/80">{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults !== undefined && (
            <div>
              <div className="mb-0.5 text-muted-foreground">Result</div>
              <pre className="whitespace-pre-wrap break-words text-foreground/80">{typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-card-foreground'}`}>
        {message.content && (
          isUser
            ? <p className="whitespace-pre-wrap text-sm">{message.content}</p>
            : <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:mb-1">{message.content}</ReactMarkdown>
        )}
        {message.tool_calls?.map((tc, i) => <ToolCall key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}