import type { Ticket, TicketStatus } from '@/types'

const API = '/api'

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch(`${API}/tickets`)
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`)
  return res.json()
}

export interface ActiveState {
  ticket: string
  agent: string
  started: string
}

export async function fetchActive(): Promise<ActiveState | null> {
  const res = await fetch(`${API}/active`)
  if (!res.ok) return null
  return res.json()
}

export async function updateTicketStatus(id: string, status: TicketStatus): Promise<void> {
  const res = await fetch(`${API}/tickets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error(`update failed: ${res.status}`)
}
