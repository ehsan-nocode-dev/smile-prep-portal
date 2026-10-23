import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EMAIL_LABELS, EmailLogEntry } from "@/lib/challenges";
import { formatTxDate } from "@/lib/crowns";

export function EmailLog({ emails }: { emails: EmailLogEntry[] }) {
  const [open, setOpen] = useState<EmailLogEntry | null>(null);

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-bold">Email preview</h2>
        <p className="text-sm text-muted-foreground">Emails production will send. Nothing is sent from this prototype.</p>
      </div>
      <div className="bg-card rounded-xl card-shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">When</th>
              <th className="text-left px-4 py-3 font-semibold">To</th>
              <th className="text-left px-4 py-3 font-semibold">Subject</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id} onClick={() => setOpen(e)} className="border-t border-border/50 hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">{formatTxDate(e.at)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{e.toLabel}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{e.subject}</div>
                  <div className="text-xs text-muted-foreground">{EMAIL_LABELS[e.kind]}</div>
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No emails yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Email preview</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-4">
              <dl className="text-sm grid grid-cols-[72px_1fr] gap-y-1.5">
                <dt className="text-muted-foreground">From</dt><dd>MolarUp &lt;hello@molarup.com&gt;</dd>
                <dt className="text-muted-foreground">To</dt>
                <dd className="break-words">{open.recipients.join(", ") || open.toLabel}</dd>
                <dt className="text-muted-foreground">Subject</dt><dd className="font-medium">{open.subject}</dd>
                <dt className="text-muted-foreground">Sent</dt><dd>{formatTxDate(open.at)}</dd>
              </dl>
              <div className="rounded-xl border border-border p-5 space-y-3 text-sm leading-relaxed">
                {open.body.map((line, i) => <p key={i}>{line}</p>)}
                <div className="pt-2">
                  <span className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold">Open MolarUp</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
