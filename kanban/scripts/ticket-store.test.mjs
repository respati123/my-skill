#!/usr/bin/env node
// Unit tests for ../lib/ticket-store.mjs — file-level only, no server/SQLite
// needed. Run: node --test kanban/scripts/ticket-store.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// TICKETS_DIR is read at module-eval time, so the env var must be set
// before the (dynamic) import — a static top-level import would already
// have run against the real repo tickets/.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ticket-store-test-'))
process.env.TICKETS_DIR = tmpDir

const { listTickets, readTicket, createTicketFile, patchFrontmatter, collapseToStub } = await import(
  '../lib/ticket-store.mjs'
)

test('createTicketFile rejects an invalid type', () => {
  const result = createTicketFile({ type: 'nope', slug: 'x' })
  assert.equal(result.error, 'invalid type: nope')
})

test('createTicketFile rejects an invalid slug', () => {
  const result = createTicketFile({ type: 'feat', slug: 'Not Valid' })
  assert.match(result.error, /invalid slug/)
})

test('createTicketFile zero-pads sequential ids', () => {
  const first = createTicketFile({ type: 'feat', slug: 'first-thing' })
  assert.equal(first.ticket.id, '0001')
  const second = createTicketFile({ type: 'fix', slug: 'second-thing' })
  assert.equal(second.ticket.id, '0002')
})

test('readTicket parses a created ticket back by id', () => {
  createTicketFile({ type: 'task', slug: 'read-me', title: 'Read Me' })
  const t = readTicket('0003')
  assert.equal(t.title, 'Read Me')
  assert.equal(t.type, 'task')
  assert.equal(t.status, 'open')
})

test('readTicket returns null for a missing id', () => {
  assert.equal(readTicket('9999'), null)
})

test('patchFrontmatter rejects an invalid status', () => {
  const result = patchFrontmatter('0003', { status: 'nonsense' })
  assert.equal(result.error, 'invalid status')
})

test('patchFrontmatter updates status and keeps the id zero-padded', () => {
  const result = patchFrontmatter('0003', { status: 'in-progress' })
  assert.equal(result.ok, true)
  assert.equal(result.ticket.status, 'in-progress')
  assert.equal(result.ticket.id, '0003')
})

test('collapseToStub keeps Description, drops Acceptance criteria, appends the link', () => {
  createTicketFile({ type: 'feat', slug: 'with-sections', title: 'With Sections' })
  const before = readTicket('0004')
  fs.writeFileSync(
    path.join(tmpDir, before.filename),
    `---\nid: '0004'\ntype: feat\nstatus: open\n---\n## Description\nBuild the thing.\n\n## Acceptance criteria\n- [ ] it works\n`,
  )

  const result = collapseToStub('0004', 'https://github.com/x/y/issues/1')

  assert.equal(result.ok, true)
  assert.match(result.ticket.body, /Build the thing\./)
  assert.doesNotMatch(result.ticket.body, /Acceptance criteria/)
  assert.match(result.ticket.body, /Full details: https:\/\/github\.com\/x\/y\/issues\/1/)
  assert.equal(result.ticket.github_url, 'https://github.com/x/y/issues/1')
})

test('listTickets returns every ticket in the store', () => {
  assert.equal(listTickets().length, 4)
})
