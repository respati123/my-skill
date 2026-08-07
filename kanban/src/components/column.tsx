import { useDroppable } from '@dnd-kit/core'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { TicketCard } from '@/components/ticket-card'
import type { Ticket } from '@/types'
import type { ActiveState } from '@/lib/api'

interface Props {
  id: string
  title: string
  accent: string
  tickets: Ticket[]
  active: ActiveState | null
  onTicketClick: (ticket: Ticket) => void
}

export function Column({ id, title, accent, tickets, active, onTicketClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tickets.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border p-2 transition-colors',
          accent,
          isOver && 'border-primary/50 ring-2 ring-primary/20',
        )}
      >
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 pr-2">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                active={active}
                onClick={() => onTicketClick(ticket)}
              />
            ))}
            {tickets.length === 0 && (
              <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
                Drop here
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
