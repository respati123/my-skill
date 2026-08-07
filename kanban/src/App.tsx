import { useEffect, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Column } from '@/components/column'
import { TicketCard } from '@/components/ticket-card'
import { TicketDetail } from '@/components/ticket-detail'
import { COLUMNS } from '@/types'
import type { Ticket, TicketStatus } from '@/types'
import { fetchTickets, fetchActive, updateTicketStatus, type ActiveState } from '@/lib/api'

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [active, setActive] = useState<ActiveState | null>(null)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const load = useCallback(async () => {
    try {
      setTickets(await fetchTickets())
      setActive(await fetchActive())
      setError(null)
    } catch {
      setError('Server not running. Start it with: node kanban/server.mjs')
    }
  }, [])

  // poll every 2s — lazy auto-refresh, no websockets
  useEffect(() => {
    load()
    const interval = setInterval(load, 2000)
    return () => clearInterval(interval)
  }, [load])

  // keep selected ticket fresh after status changes
  useEffect(() => {
    if (!selectedTicket) return
    const updated = tickets.find((t) => t.id === selectedTicket.id)
    if (updated && updated !== selectedTicket) setSelectedTicket(updated)
  }, [tickets, selectedTicket])

  const handleDragStart = (e: DragStartEvent) => {
    const t = tickets.find((t) => t.id === e.active.id)
    setActiveTicket(t || null)
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveTicket(null)
    const { active, over } = e
    if (!over) return
    const newStatus = over.id as TicketStatus
    const ticket = tickets.find((t) => t.id === active.id)
    if (!ticket || ticket.status === newStatus) return
    try {
      await updateTicketStatus(ticket.id, newStatus)
      load()
    } catch {
      setError('Failed to update ticket status')
    }
  }

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedTicket) return
    try {
      await updateTicketStatus(selectedTicket.id, status)
      load()
    } catch {
      setError('Failed to update ticket status')
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-lg font-bold tracking-tight">Kanban</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{tickets.length} tickets</span>
          {error && <span className="text-destructive">{error}</span>}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto p-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              title={col.title}
              accent={col.accent}
              tickets={tickets.filter((t) => t.status === col.id)}
              active={active}
              onTicketClick={setSelectedTicket}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket && (
            <div className="w-72 opacity-90">
              <TicketCard ticket={activeTicket} active={null} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <TicketDetail
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
