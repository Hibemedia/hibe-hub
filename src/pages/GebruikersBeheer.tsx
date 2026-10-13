import { useEffect, useState } from "react";
import { Users, Plus, Trash2, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/context/ClientContext";
import { UserAuth } from "@/context/AuthContext.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Row { id: string; email: string; full_name: string | null; client_id: string | null; created_at: string; role: string }

export default function GebruikersBeheer() {
  const { clients } = useClient();
  const { user } = UserAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "client", client_id: "" });
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const load = async () => {
    const [{ data: users }, { data: roles }] = await Promise.all([
      supabase.from("users").select("id,email,full_name,client_id,created_at").order("created_at"),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const roleOf = (id: string) => (roles ?? []).some((r) => r.user_id === id && r.role === "admin") ? "admin" : "client";
    setRows((users ?? []).map((u) => ({ ...u, role: roleOf(u.id) })));
  };
  useEffect(() => { load(); }, []);

  const invite = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("inviteUser", {
      body: { ...form, client_id: form.role === "client" ? form.client_id : null, redirect_to: `${window.location.origin}/reset-password` },
    });
    setBusy(false);
    if (error) {
      let msg = error.message;
      try { msg = (await (error as any).context?.json())?.error ?? msg; } catch { /* ignore */ }
      return toast.error(msg);
    }
    if (data?.error) return toast.error(data.error);
    toast.success(`Uitnodiging verstuurd naar ${form.email}`);
    setOpen(false); setForm({ email: "", full_name: "", role: "client", client_id: "" });
    load();
  };

  const sendReset = async (r: Row) => {
    const { error } = await supabase.auth.resetPasswordForEmail(r.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message); else toast.success(`Resetmail verstuurd naar ${r.email}`);
  };

  const remove = async () => {
    if (!toDelete) return;
    const { data, error } = await supabase.functions.invoke("deleteUser", { body: { user_id: toDelete.id } });
    if (error || data?.error) toast.error(data?.error ?? "Verwijderen mislukt");
    else { toast.success("Gebruiker verwijderd"); load(); }
    setToDelete(null);
  };

  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.name ?? "–";

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Users className="h-7 w-7" />Gebruikers</h1>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Gebruiker uitnodigen</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Gebruiker</TableHead><TableHead>Rol</TableHead><TableHead>Klant</TableHead><TableHead>Aangemaakt</TableHead><TableHead className="w-28" /></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell><div className="font-medium">{r.full_name || r.email}</div>{r.full_name && <div className="text-xs text-muted-foreground">{r.email}</div>}</TableCell>
                <TableCell><Badge variant={r.role === "admin" ? "default" : "secondary"}>{r.role === "admin" ? "HIBE (admin)" : "Klant"}</Badge></TableCell>
                <TableCell>{r.role === "admin" ? "Alle klanten" : clientName(r.client_id)}</TableCell>
                <TableCell>{new Date(r.created_at).toLocaleDateString("nl-NL")}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Resetmail sturen" title="Resetmail sturen" onClick={() => sendReset(r)}><KeyRound className="h-4 w-4" /></Button>
                  {r.id !== user?.id && <Button variant="ghost" size="icon" aria-label="Verwijderen" title="Verwijderen" onClick={() => setToDelete(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gebruiker uitnodigen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="em">E-mailadres</Label><Input id="em" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label htmlFor="fn">Naam</Label><Input id="fn" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} maxLength={200} /></div>
            <div className="space-y-2"><Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="client">Klantgebruiker</SelectItem><SelectItem value="admin">HIBE-medewerker (admin)</SelectItem></SelectContent>
              </Select>
            </div>
            {form.role === "client" && (
              <div className="space-y-2"><Label>Klant</Label>
                <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Kies een klant" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={invite} disabled={busy || !form.email || (form.role === "client" && !form.client_id)}>Uitnodiging versturen</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Gebruiker verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete?.email} verliest direct toegang tot het portaal.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuleren</AlertDialogCancel><AlertDialogAction onClick={remove}>Verwijderen</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
