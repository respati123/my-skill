import { useDraggable } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TYPE_STYLES, TYPE_LABELS } from '@/types'
import type { Ticket } from '@/types'
import type { ActiveState } from '@/lib/api'
import { cn } from '@/lib/utils'

const STALE_THRESHOLD_MS = 30 * 60 * 1000 // 30 minutes

interface Props {
  ticket: Ticket
  active: ActiveState | null
  onClick: () => void
}

export function TicketCard({ ticket, active, onClick }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
  })

  const isActive = active?.agent && active.ticket === ticket.id
  const isStale =
    isActive && active!.started
      ? Date.now() - new Date(active!.started).getTime() > STALE_THRESHOLD_MS
      : false

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging && 'opacity-50')}>
      <Card
        onClick={onClick}
        className={cn(
          'cursor-pointer p-3 transition-shadow hover:shadow-md',
          isActive && (isStale ? 'ring-2 ring-amber-500/40 bg-amber-500/5' : 'ring-2 ring-blue-500/40 bg-blue-500/5'),
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className={cn('border font-mono text-[10px]', TYPE_STYLES[ticket.type])}>
            {TYPE_LABELS[ticket.type]}
          </Badge>
          <span className="font-mono text-[10px] text-muted-foreground">#{ticket.id}</span>
          {isActive && (
            <span
              className={cn(
                'ml-auto flex items-center gap-1 text-[10px] font-medium',
                isStale ? 'text-amber-600' : 'text-blue-600',
              )}
            >
              <span
                className={cn(
                  'inline-block h-2 w-2 animate-pulse rounded-full',
                  isStale ? 'bg-amber-500' : 'bg-blue-500',
                )}
              />
              {isStale ? 'stale lock' : `${active!.agent} working`}
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug">{ticket.title}</p>
        {ticket.labels.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {ticket.labels.map((label) => (
              <Badge key={label} variant="secondary" className="text-[10px]">
                {label}
              </Badge>
            ))}
          </div>
        )}
        {ticket.github_url && (
          <a
            href={ticket.github_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-block text-[10px] text-blue-600 hover:underline"
          >
            GitHub ↗
          </a>
        )}
      </Card>
    </div>
  )
}
