import { useDraggable } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { TYPE_STYLES, TYPE_LABELS } from '@/types'
import type { Ticket } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  ticket: Ticket
  onClick: () => void
}

export function TicketCard({ ticket, onClick }: Props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
  })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn(isDragging && 'opacity-50')}>
      <Card
        onClick={onClick}
        className="cursor-pointer p-3 transition-shadow hover:shadow-md"
      >
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className={cn('border font-mono text-[10px]', TYPE_STYLES[ticket.type])}>
            {TYPE_LABELS[ticket.type]}
          </Badge>
          <span className="font-mono text-[10px] text-muted-foreground">#{ticket.id}</span>
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
