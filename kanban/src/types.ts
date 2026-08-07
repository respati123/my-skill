export type TicketType = 'feat' | 'fix' | 'task' | 'chore' | 'docs'

export type TicketStatus = 'open' | 'in-progress' | 'review' | 'qa' | 'done'

export interface Ticket {
  id: string
  type: TicketType
  slug: string
  title: string
  status: TicketStatus
  parent: string | null
  labels: string[]
  github_url: string | null
  filename: string
  body: string
  updated_at: string
}

// Column definitions — the board's pipeline stages
export const COLUMNS: { id: TicketStatus; title: string; accent: string }[] = [
  { id: 'open', title: 'Backlog', accent: 'bg-muted/60' },
  { id: 'in-progress', title: 'Coder', accent: 'bg-blue-500/10' },
  { id: 'review', title: 'Review', accent: 'bg-amber-500/10' },
  { id: 'qa', title: 'QA', accent: 'bg-purple-500/10' },
  { id: 'done', title: 'Done', accent: 'bg-green-500/10' },
]

export const TYPE_STYLES: Record<TicketType, string> = {
  feat: 'bg-green-500/15 text-green-700 border-green-500/30',
  fix: 'bg-red-500/15 text-red-700 border-red-500/30',
  task: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  chore: 'bg-gray-500/15 text-gray-600 border-gray-500/30',
  docs: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
}

export const TYPE_LABELS: Record<TicketType, string> = {
  feat: 'feat',
  fix: 'bug',
  task: 'task',
  chore: 'chore',
  docs: 'docs',
}
