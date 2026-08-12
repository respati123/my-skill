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

The collection is organized by **resource** (folder), with each case as a
sub-item. Below is a **concrete, working example** — copied from a real
project's `docs/postman/collection.json` — showing the exact shape the coder
should produce: `{{baseUrl}}` variable, concrete request body (not
placeholders), and a `pm.test(...)` test script on every request so the
collection is runnable as a regression suite.

```json
{
  "info": {
    "name": "Project API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000", "type": "string" }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Signup — valid",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{baseUrl}}/auth/signup", "host": ["{{baseUrl}}"], "path": ["auth", "signup"] },
            "body": { "mode": "raw", "raw": "{\"companyName\":\"Acme Corp\",\"adminName\":\"Ada Admin\",\"adminEmail\":\"ada@acme.com\",\"password\":\"password123\"}" }
          },
          "event": [{
            "listen": "test",
            "script": {
              "type": "text/javascript",
              "exec": [
                "pm.test('returns 201', () => pm.response.to.have.status(201));",
                "pm.test('success envelope', () => { const b = pm.response.json(); pm.expect(b.status).to.eql('success'); });",
                "pm.test('has tenant, user, session', () => { const b = pm.response.json().data; pm.expect(b.tenant.id).to.match(/^[0-9a-f-]{36}$/); pm.expect(b.user.role).to.eql('TENANT_ADMIN'); pm.expect(b.session.token.length).to.be.greaterThan(20); });"
              ]
            }
          }]
        },
        {
          "name": "Signup — duplicate email",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{baseUrl}}/auth/signup", "host": ["{{baseUrl}}"], "path": ["auth", "signup"] },
            "body": { "mode": "raw", "raw": "{\"companyName\":\"Acme Corp\",\"adminName\":\"Ada Admin\",\"adminEmail\":\"ada@acme.com\",\"password\":\"password123\"}" }
          },
          "event": [{
            "listen": "test",
            "script": {
              "type": "text/javascript",
              "exec": [
                "pm.test('returns 409', () => pm.response.to.have.status(409));",
                "pm.test('error envelope', () => { const b = pm.response.json(); pm.expect(b.status).to.eql('error'); pm.expect(b.error.message).to.include('already exists'); });"
              ]
            }
          }]
        },
        {
          "name": "Signup — missing required field",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{baseUrl}}/auth/signup", "host": ["{{baseUrl}}"], "path": ["auth", "signup"] },
            "body": { "mode": "raw", "raw": "{\"companyName\":\"Acme Corp\"}" }
          },
          "event": [{
            "listen": "test",
            "script": {
              "type": "text/javascript",
              "exec": [
                "pm.test('returns 422', () => pm.response.to.have.status(422));",
                "pm.test('error names the missing field', () => { const b = pm.response.json(); pm.expect(b.error.message).to.include('adminName'); });"
              ]
            }
          }]
        }
      ]
    }
  ]
}
```

### What to copy from this example

- **`{{baseUrl}}` variable** — never hardcode `localhost:3000` in a URL;
  define it once in `variable[]` and reference it everywhere.
- **Concrete request body** — real values (`"Acme Corp"`), not
  `{{placeholder}}` for required business fields. Auth tokens via
  `{{token}}` is fine; required data must be literal so the request is
  runnable as-is.
- **A test script on EVERY request** (`event[].listen: "test"`) — assert
  status code + response envelope shape + key fields. A request without a
  test script is documentation; with one, it's a regression check.
- **Response envelope consistency** — this project uses
  `{status, data}` on success and `{status, error}` on failure. Match
  whatever envelope the backend actually returns; the test scripts enforce
  it.
- **One case per sub-item, named for the case** — `"Signup — valid"`,
  `"Signup — duplicate email"`, `"Signup — missing required field"`. The
  name says what the case tests, not just the method + path.

Resource folder → cases as sub-items. The name says the case, not just the
method + path repeated.
