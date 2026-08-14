# Ticket `.md` files stay the source of truth; SQLite is a read projection

The kanban board (`kanban/server.mjs`) indexes `tickets/*.md` into SQLite for
fast reads, and it's tempting to assume SQLite is the real store once a
board and an HTTP API sit in front of it. It isn't: SQLite is rebuilt
entirely from the files on every reindex, `kanban/data/*.db` is gitignored,
and every write path (status changes, migration to GitHub, the new
body-collapse on migration) mutates the `.md` file first and lets the
existing file watcher re-derive SQLite — never the other way round.

Kept this way deliberately, even when extracting `kanban/lib/ticket-store.mjs`
gave a natural chance to reconsider: flipping it (SQLite authoritative, files
generated from it) would drop the audit trail `git log`/`git diff` on
`tickets/` currently gives for free, and would require rebuilding the
watcher against SQLite instead of the filesystem. A future contributor
adding a feature that needs a live DB connection to write a Ticket (a
migration, a bulk-status script, anything running outside the server
process) should reach for `ticket-store.mjs`'s file-level functions
directly, not for SQLite.
