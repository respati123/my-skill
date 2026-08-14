import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TYPE_STYLES, TYPE_LABELS, COLUMNS } from '@/types'
import type { Ticket, TicketStatus } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  ticket: Ticket | null
  onClose: () => void
  onStatusChange: (status: TicketStatus) => void
}

export function TicketDetail({ ticket, onClose, onStatusChange }: Props) {
  return (
    <Dialog open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {ticket && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('border font-mono text-xs', TYPE_STYLES[ticket.type])}>
                  {TYPE_LABELS[ticket.type]}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">#{ticket.id}</span>
                {ticket.github_url && (
                  <a
                    href={ticket.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    GitHub ↗
                  </a>
                )}
              </div>
              <DialogTitle className="text-lg">{ticket.title}</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Select value={ticket.status} onValueChange={(v) => onStatusChange(v as TicketStatus)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {ticket.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ticket.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            <div className="max-h-[40vh] overflow-auto">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-muted-foreground">
                {ticket.body || '(no description)'}
              </pre>
            </div>

            <p className="font-mono text-[10px] text-muted-foreground">{ticket.filename}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
