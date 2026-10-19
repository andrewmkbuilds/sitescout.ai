import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, Loader2, FileText, Settings2, ChevronDown } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import PitchTemplateEditor from '@/components/PitchTemplateEditor';
import TemplateLibrary from '@/components/outreach/TemplateLibrary';
import { useToast } from '@/components/ui/use-toast';
import { MESSAGE_TYPES } from '@/lib/appUtils';

export default function Templates() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(null); // null | 'new' | template record
  const [showCustom, setShowCustom] = useState(false);

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me().catch(() => null) });
  const agency = user?.agency_profile || { name: '', website: '', services: '' };

  const { data: templates, isLoading } = useQuery({
    queryKey: ['pitch-templates'],
    queryFn: async () => {
      const page = await base44.entities.PitchTemplate.filter({}, { sort: '-created_date', limit: 100 });
      return page.items || [];
    },
  });

  const handleSave = async (form) => {
    try {
      if (editing && editing.id) {
        await base44.entities.PitchTemplate.update(editing.id, form);
        toast({ title: 'Template updated' });
      } else {
        await base44.entities.PitchTemplate.create({ ...form, is_builtin: false, is_fallback: false });
        toast({ title: 'Custom template saved' });
      }
      qc.invalidateQueries({ queryKey: ['pitch-templates'] });
      setEditing(null);
    } catch (e) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (t) => {
    try {
      await base44.entities.PitchTemplate.delete(t.id);
      qc.invalidateQueries({ queryKey: ['pitch-templates'] });
      if (editing && editing.id === t.id) setEditing(null);
      toast({ title: 'Template deleted' });
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    }
  };

  const customAndFallback = (templates || []).filter((t) => !t.is_builtin || t.is_fallback);
  const current = editing === 'new' ? null : editing;

  return (
    <div>
      <PageHeader
        title="Outreach Templates"
        description="A library of 50 built-in outreach templates plus your own. Browse by category, tone, and channel, preview each one, and copy or apply it in Outreach. Placeholders fill safely with each prospect's real evidence — nothing is fabricated."
      />

      <TemplateLibrary customTemplates={templates || []} />

      {/* Custom template manager */}
      <div className="mt-8">
        <button type="button" onClick={() => setShowCustom((v) => !v)} className="flex items-center gap-1 text-sm font-semibold">
          <Settings2 className="h-4 w-4" /> Your custom & fallback templates ({customAndFallback.length})
          <ChevronDown className={`h-4 w-4 transition ${showCustom ? 'rotate-180' : ''}`} />
        </button>
        {showCustom && (
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Saved custom templates</h3>
                <Button size="sm" onClick={() => setEditing('new')}><Plus className="mr-1 h-3.5 w-3.5" /> New template</Button>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : customAndFallback.length ? (
                <div className="space-y-2">
                  {customAndFallback.map((t) => (
                    <Card key={t.id} className={editing && editing.id === t.id ? 'border-primary' : ''}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditing(t)}>
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-medium">{t.name}</p>
                              {t.is_fallback && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400">Fallback</Badge>}
                              {!t.is_fallback && <Badge variant="outline" className="text-[10px] border-violet-500/40 text-violet-600 dark:text-violet-400">Custom</Badge>}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-[10px]">{t.business_type || 'Any'}</Badge>
                              <Badge variant="secondary" className="text-[10px]">{MESSAGE_TYPES.find((m) => m.value === t.message_type)?.label || t.message_type}</Badge>
                              {t.tone && <Badge variant="outline" className="text-[10px] capitalize">{t.tone}</Badge>}
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{t.body_template}</p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState icon={FileText} title="No custom templates" description="Create your own template to reuse across prospects. Built-in templates can be copied here to edit." />
              )}
            </div>
            <div>
              {editing ? (
                <PitchTemplateEditor key={current?.id || 'new'} template={current} agency={agency} onSave={handleSave} onCancel={() => setEditing(null)} />
              ) : (
                <EmptyState icon={FileText} title="No template selected" description="Select a custom template to edit it, or click 'New template' to create one." />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}