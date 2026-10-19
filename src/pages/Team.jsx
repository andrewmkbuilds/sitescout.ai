import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Building2, UserPlus, Crown, Shield, User, Loader2, Mail } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/ui-bits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';

const ROLE_ICON = { admin: Shield, owner: Crown, user: User };
const ROLE_TONE = { admin: 'text-primary', owner: 'text-amber-500', user: 'text-muted-foreground' };

export default function Team() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);

  const { data: members } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const page = await base44.entities.User.list({ sort: 'created_date', limit: 50 });
      return page.items || [];
    },
  });

  const invite = async () => {
    if (!inviteEmail) { toast({ title: 'Email required', variant: 'destructive' }); return; }
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      qc.invalidateQueries({ queryKey: ['team-members'] });
      setInviteEmail('');
      toast({ title: 'Invitation sent', description: `Invited ${inviteEmail} as ${inviteRole}.` });
    } catch (e) {
      toast({ title: 'Invite failed', description: e.message, variant: 'destructive' });
    } finally {
      setInviting(false);
    }
  };

  const isOwner = user?.role === 'admin';

  return (
    <div>
      <PageHeader title="Team Workspace" description="Your organization and team members. Data is isolated per account with server-side authorization." />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Building2 className="h-4 w-4 text-primary" /> Organization</h3>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'My'}'s Workspace</p>
              <p className="mt-1 text-xs text-muted-foreground">Owner: {user?.email}</p>
              <p className="mt-2 text-xs text-muted-foreground">Records in this workspace are private to your account. Each user only sees their own businesses, leads, audits, and settings — enforced server-side via row-level security.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4 text-primary" /> Invite member</h3>
            <div><Label className="text-xs">Email</Label><Input className="mt-1" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@agency.com" /></div>
            <div><Label className="text-xs">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="user">Member</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
              </Select>
            </div>
            <Button onClick={invite} disabled={inviting || !isOwner} className="w-full">
              {inviting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Inviting…</> : <><Mail className="mr-2 h-4 w-4" /> Send invite</>}
            </Button>
            {!isOwner && <p className="text-[10px] text-muted-foreground">Only admins can invite members.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">Members ({(members || []).length})</h3>
        {(members || []).length ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground"><tr><th className="px-3 py-2 text-left font-medium">Member</th><th className="px-3 py-2 text-left font-medium">Role</th></tr></thead>
              <tbody>
                {members.map((m) => {
                  const RIcon = ROLE_ICON[m.role] || User;
                  return (
                    <tr key={m.id} className="border-t border-border">
                      <td className="px-3 py-2"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{(m.full_name || m.email || 'U').charAt(0).toUpperCase()}</span><div><p className="font-medium">{m.full_name || m.email}</p><p className="text-xs text-muted-foreground">{m.email}</p></div></div></td>
                      <td className="px-3 py-2"><Badge variant="outline" className={`gap-1 capitalize ${ROLE_TONE[m.role] || ''}`}><RIcon className="h-3 w-3" />{m.role}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState icon={User} title="No members yet" description="Invite teammates to collaborate." />}
      </div>
    </div>
  );
}