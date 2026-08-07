# Postman / API Docs Rules

The project's API documentation lives in a Postman collection at
`docs/postman/`. This is the **canonical API contract** — not an
afterthought, not "nice to have." Every endpoint the code exposes must be
documented here, and the docs must cover **every case the endpoint can
produce**, not just the happy path.

## When the coder writes/updates Postman docs

**Every time an endpoint is added or changed**, in the same PR — no
exceptions. "Changed" includes: new route, new method on an existing route,
changed request shape (params, body, query), changed response shape, or
changed status codes returned.

## What each endpoint entry must contain

One **request** per **case** — sub-requests, not a single happy-path
example. An endpoint that can return four distinct outcomes has four
entries. Missing cases are the same as missing docs.

For each case:

- **Method + URL** — `GET /orders/:id`, `POST /orders`, etc.
- **Description** — one line: what this case tests (e.g. "create order —
  valid input, returns 201", "create order — missing field, returns 422").
- **Request** — headers, params, body. Real values, not `{{placeholder}}`
  for required fields (auth tokens via `{{variable}}` is fine; required
  business values must be concrete).
- **Expected response** — status code + body shape. Use a **test script**
  (`pm.test(...)`) that asserts the status code and key fields, so the
  collection is runnable as a regression suite, not just a reference doc.

### Required cases per endpoint

At minimum, every endpoint documents:

1. **Positive / happy path** — valid input, expected success response (200,
   201, 204).
2. **Negative — validation failure** — invalid/missing input, expected
   error response (400, 422). One per distinct validation rule that
   produces a different error shape.
3. **Negative — auth/authz failure** — unauthenticated (401),
   unauthorized (403), if the endpoint is protected.
4. **Negative — not found** — valid request but resource doesn't exist
   (404), if the endpoint targets a specific resource.
5. **Conflict** — duplicate create, stale version, etc. (409), if the
   endpoint can produce it.

Not every endpoint produces every case. But a case the endpoint *can*
produce that isn't documented is a gap — the reviewer checks for this.

### What "all cases" means in practice

Think of it as: **if QA runs only the Postman collection against this
endpoint, would they discover every bug?** If not, cases are missing. The
collection is the executable spec — a case not in it is a case nobody
tests.

## Reviewer (techlead) gate

If the diff adds or changes an endpoint and the Postman collection is not
updated in the same PR, or is updated with only the happy path (no negative
cases), that is a **BLOCKING** finding. The review checks:

- Is every new/changed endpoint documented?
- Does each have at least the positive + one negative case?
- Are the negative cases the ones the endpoint actually produces (not
  invented generic errors)?
- Is each entry runnable (has a test script asserting the response)?

## Collection structure

```
docs/postman/
└── collection.json
```

The collection is organized by **resource**, not by case:

```json
{
  "info": { "name": "Project API" },
  "item": [
    {
      "name": "Orders",
      "item": [
        { "name": "Create — valid",     "request": { ... } },
        { "name": "Create — missing field", "request": { ... } },
        { "name": "Create — duplicate",  "request": { ... } },
        { "name": "Get — exists",       "request": { ... } },
        { "name": "Get — not found",    "request": { ... } }
      ]
    }
  ]
}
```

Resource folder → cases as sub-items. The name says the case, not just the
method + path repeated.
