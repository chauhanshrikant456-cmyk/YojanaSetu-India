import { useEffect, useState } from 'react';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/audit';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const result = await base44.entities.User.list({ sort: '-created_date', limit: 200 });
      setUsers(Array.isArray(result) ? result : result.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (target, role) => {
    const updated = await base44.entities.User.update(target.id, { role });
    setUsers((current) => current.map((item) => (item.id === target.id ? { ...item, role } : item)));
    await logAudit({
      action: 'role_change',
      entityName: 'User',
      entityId: target.id,
      entityLabel: target.email,
      details: `Role set to ${role}`,
      user
    });
    toast({ title: `Role updated for ${updated.email || target.email}` });
  };

  const sendInvite = async (event) => {
    event.preventDefault();
    setError('');
    const email = inviteEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setInviting(true);
    try {
      await base44.users.inviteUser(email, inviteRole);
      await logAudit({
        action: 'create',
        entityName: 'User',
        entityId: null,
        entityLabel: email,
        details: `Invited as ${inviteRole}`,
        user
      });
      toast({ title: 'Invitation sent', description: `${email} was invited as ${inviteRole}.` });
      setInviteEmail('');
      setInviteOpen(false);
      await load();
    } catch (inviteError) {
      setError(inviteError.message || 'The invitation could not be sent.');
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="User directory"
        description="Invite people and manage who has administrator access. Administrators can see and change all catalog data and manage other users."
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite a user
          </Button>
        }
      />

      <div className="mb-5 flex items-start gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        Granting the admin role gives full access to every student record, document verification and the whole catalog.
      </div>

      {loading ? (
        <LoadingRows count={5} />
      ) : users.length === 0 ? (
        <EmptyState icon={UserPlus} title="No registered users yet" description="Invite the first administrator or student to get started." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">User</TableHead>
                <TableHead className="w-[240px]">Email</TableHead>
                <TableHead className="w-[170px]">Role</TableHead>
                <TableHead className="w-[140px]">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.full_name || 'Name not provided'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.email}</TableCell>
                  <TableCell>
                    <Select value={item.role || 'user'} onValueChange={(value) => changeRole(item, value)}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User — student access</SelectItem>
                        <SelectItem value="admin">Admin — full console access</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(item.created_date, '—')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>
              They receive an invitation to join this app. Assign administrator access only where it is genuinely needed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sendInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User — student access</SelectItem>
                  <SelectItem value="admin">Admin — full console access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting}>{inviting ? 'Sending…' : 'Send invitation'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}