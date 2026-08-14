#!/usr/bin/env node
/**
 * GitHub adapter — the seam between the Ticket domain and GitHub's issue model.
 *
 * Owns all `gh` CLI interaction: creating issues, closing them, linking
 * sub-issues, resolving the GitHub database id from an issue number.
 * Callers pass Tickets + issue numbers, never shell strings or URLs.
 *
 * Distinct from ticket-store.mjs, which owns the file-level `.md` writes.
 * Migration (the flow in scripts/migrate-to-github.mjs) uses both.
 *
 * See CONTEXT.md "GitHub adapter"; ADR-0001 (file stays source of truth)
 * is untouched — this module talks to GitHub, never to tickets/*.md.
 */

import { execFileSync } from 'node:child_process'

// ── repo / auth ──────────────────────────────────────────────────────────

export function getRepoSlug() {
  // read the remote URL the same way git does; parse owner/repo out of either
  // ssh (git@github.com:owner/repo.git) or https (https://github.com/owner/repo.git)
  let url
  try {
    url = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf-8' }).trim()
  } catch {
    return null
  }
  const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
  return m ? `${m[1]}/${m[2]}` : null
}

export function authStatus() {
  // throws if gh isn't authed — caller wraps to produce a clean error
  execFileSync('gh', ['auth', 'status'], { encoding: 'utf-8', stdio: ['ignore', 'ignore', 'pipe'] })
}

// ── issues ───────────────────────────────────────────────────────────────

const TYPE_TO_LABEL = {
  feat: 'feature',
  fix: 'bug',
  task: 'task',
  chore: 'chore',
  docs: 'documentation',
}

/**
 * Create a GitHub issue. Body is piped via stdin (--body-file -) so any
 * content (quotes, backticks, $(...), length) is safe — no shell, no escaping.
 * Returns the new issue's URL.
 */
export function createIssue(repo, { title, body, type = null, labels = [] }) {
  const allLabels = [
    ...(type ? [TYPE_TO_LABEL[type] || 'task'] : []),
    ...labels,
  ]
  const args = [
    'issue', 'create',
    '--repo', repo,
    '--title', title,
    '--body-file', '-',
    ...allLabels.flatMap((l) => ['--label', l]),
  ]
  // pipe body to stdin
  return execFileSync('gh', args, { encoding: 'utf-8', input: body }).trim()
}

export function closeIssue(repo, issueNumber) {
  execFileSync('gh', ['issue', 'close', String(issueNumber), '--repo', repo], { encoding: 'utf-8' })
}

/**
 * Link a sub-issue to its parent via GitHub's sub_issues API.
 * Takes issue NUMBERS (GitHub's domain unit); the sub-issue's internal
 * database id is resolved here via --jq .id — callers never see it.
 */
export function linkSubIssue(repo, parentNumber, subNumber) {
  const subDbId = execFileSync(
    'gh',
    ['api', `repos/${repo}/issues/${subNumber}`, '--jq', '.id'],
    { encoding: 'utf-8' },
  ).trim()
  execFileSync(
    'gh',
    ['api', `repos/${repo}/issues/${parentNumber}/sub_issues`, '-F', `sub_issue_id=${subDbId}`],
    { encoding: 'utf-8' },
  )
}
