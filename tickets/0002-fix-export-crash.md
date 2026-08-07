---
id: '0002'
type: fix
status: done
parent: null
labels:
  - backend
  - critical
github-url: null
---

# Export CSV crashes on empty dataset

## Reproduction
1. Go to reports
2. Click Export with zero rows
3. App crashes

## Fix
Guard against null before mapping.
