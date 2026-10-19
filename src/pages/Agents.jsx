import React, { useState } from 'react';
import { MessageSquare, Gauge, Mail, Bot } from 'lucide-react';
import AgentChat from '@/components/agents/AgentChat';

const AGENTS = [
  {
    name: 'communication_advisor',
    label: 'Comms Advisor',
    icon: MessageSquare,
    description: 'Recommends the best channel, timing, tone, and messaging angle for each pending follow-up task.',
    prompts: [
      'Review my pending follow-ups and suggest how to approach each one',
      'Which pending task is most urgent and why?',
      'Suggest a follow-up angle for my oldest pending task',
    ],
  },
  {
    name: 'site_analyst',
    label: 'Site Analyst',
    icon: Gauge,
    description: 'Runs a live audit on a prospect\'s site and builds a custom website concept report you can pitch from.',
    prompts: [
      'Analyze the website for "Example Bakery" and build a concept report',
      'Audit example.com and design a redesign concept',
      'Run a live site analysis on my most recent prospect',
    ],
  },
  {
    name: 'outreach_writer',
    label: 'Outreach Writer',
    icon: Mail,
    description: 'Drafts a personalized, audit-backed outreach email for a specific lead and saves it as a draft.',
    prompts: [
      'Draft a first-contact email for my newest lead',
      'Write a follow-up email for a lead that hasn\'t replied',
      'Draft an audit-summary pitch for a qualified lead',
    ],
  },
];

export default function Agents() {
  const [active, setActive] = useState(AGENTS[0]);
  const ActiveIcon = active.icon;

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 lg:flex-row">
      {/* Agent list */}
      <div className="flex shrink-0 gap-3 overflow-x-auto pb-1 lg:w-72 lg:flex-col lg:overflow-visible lg:pb-0">
        {AGENTS.map((a) => {
          const Icon = a.icon;
          const on = a.name === active.name;
          return (
            <button
              key={a.name}
              onClick={() => setActive(a)}
              className={`flex min-w-[220px] items-start gap-3 rounded-xl border p-3 text-left transition-colors lg:min-w-0 lg:w-full ${on ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{a.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">{a.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Chat panel */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><ActiveIcon className="h-4 w-4" /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{active.label}</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Bot className="h-3 w-3" /> AI Agent</p>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <AgentChat agent={active} />
        </div>
      </div>
    </div>
  );
}