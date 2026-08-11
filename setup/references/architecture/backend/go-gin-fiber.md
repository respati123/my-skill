# Go — Gin / Fiber (Backend)

Reference for Go REST backends built with **Gin** (~89k★) or **Fiber** (~40k★).
Distilled from the high-star Go API boilerplates the ecosystem converges on —
[`qiangxue/go-rest-api`](https://github.com/qiangxue/go-rest-api) (1.7k★,
package-by-feature clean arch),
[`gbrayhan/microservices-go`](https://github.com/gbrayhan/microservices-go) (Gin +
GORM, DDD layout),
[`chuanghiduoc/fiber-golang-boilerplate`](https://github.com/chuanghiduoc/fiber-golang-boilerplate)
(Fiber + sqlc + pgx),
[`hrshadhin/fiber-go-boilerplate`](https://github.com/hrshadhin/fiber-go-boilerplate)
(Fiber, layered). Pick **Gin** for the largest ecosystem and middleware breadth;
pick **Fiber** for Express ergonomics and lower allocations. The conventions
below are framework-agnostic — swap `*gin.Context` for `fiber.Ctx` and
`ShouldBindJSON` for `BodyParser`.

## Recommended stack components

| Layer | Pick | Notes |
|-------|------|-------|
| Language | **Go 1.22+** (1.21+ minimum for `log/slog`) | `context.Context` threaded through every signature |
| Framework | **Gin `v1.10+`** or **Fiber `v3`** | Gin = httprouter, biggest ecosystem; Fiber = fasthttp, Express-like |
| ORM/DB | **GORM** *or* **sqlc + pgx/v5** *or* **sqlx** | sqlc trending for type safety — write SQL, get generated Go. GORM for fast CRUD. |
| Validation | **`go-playground/validator/v10`** | Wired into Gin's binding by default; Fiber calls `Validate()` manually |
| Router | Framework built-in | One group per resource |
| Config | **viper** (files + env) *or* **`caarlos0/env`** / **joho/godotenv** (env-only) | structs with `env:` tags |
| Logging | **`log/slog`** (stdlib, 1.21+) *or* **zerolog** | structured JSON, never `fmt.Println` |
| Linter | **golangci-lint** | CI gate |
| Test | stdlib `testing` + **testify** | table-driven tests |
| Migration | **golang-migrate** *or* **goose** | SQL files, versioned |
| DI | **manual constructors** *or* **google/wire** (codegen) | no runtime reflection containers |

## Folder structure

Go projects converge on one of two layouts. **Package-by-feature** (qiangxue,
chuanghiduoc) is the majority pattern and scales better than package-by-layer
because a feature's handler/service/repo sit together and the import graph
stays shallow.

```
project/
├── cmd/
│   └── api/
│       └── main.go              # wire deps, start server. One binary = one cmd/.
├── internal/                    # import-restricted; not importable by other modules
│   ├── config/                  # config struct + loader
│   ├── entity/  (or domain/)    # shared domain types (entity.User, entity.ID)
│   ├── errors/                  # sentinel + HTTP error mapping
│   ├── <feature>/               # PACKAGE-BY-FEATURE — the majority pattern
│   │   ├── handler.go           #   HTTP: parse, validate, call service, write response
│   │   ├── service.go           #   business logic interface + impl
│   │   ├── repository.go        #   data access interface + impl
│   │   ├── dto.go               #   request/response structs (don't leak entity)
│   │   └── *_test.go            #   tests live next to the code
│   └── router/                  # assemble routes, mount middleware
├── migrations/                  # <NNN>_name.up.sql / .down.sql
├── queries/                     # .sql files for sqlc (if used)
├── pkg/                         # reusable, importable helpers (log, db, auth)
├── sqlc.yaml / .golangci.yml / Makefile / Dockerfile
├── go.mod / go.sum
└── .env.example
```

Alternative (DDD/layered, used by gbrayhan): `src/{domain,application,infrastructure}`
with `infrastructure/{rest,repository,di}`. Heavier; pick it only if the domain
logic genuinely outruns the feature folder.

**Rules baked into the layout:**

- **`cmd/` holds only `main.go`** — wiring, no business logic. qiangxue:
  `cmd/server/main.go`; chuanghiduoc: `cmd/api/main.go`. Multiple binaries =
  multiple `cmd/<name>/` dirs (e.g. `cmd/seed`).
- **`internal/` is non-negotiable** — Go's compiler enforces that nothing
  outside the module can import it. Put everything app-specific here.
- **`pkg/` is for genuinely reusable code** — `pkg/log`, `pkg/db`, `pkg/response`.
  Don't dump app code here to escape `internal/`.
- **One folder per feature, not per layer** — `internal/user/{handler,service,repository}.go`,
  not `internal/handlers/user.go` + `internal/services/user.go`. When a feature
  grows, it grows in its own folder, not by scattering across layer folders.
- **Tests sit next to the code** — `user/service.go` → `user/service_test.go`.
  Same package (`package user`), white-box access.

## Conventions

### Package naming

- **lowercase, single word** — `user`, `album`, `medicine`, never `userService`
  or `user_service`.
- **package name = import path's last segment** — `internal/user` →
  `package user`. Callers write `user.NewService()`, not `userService.New()`.
- **no stutter** — `user.NewService()`, not `user.NewUserService()`.
- **`internal/entity` (or `domain`)** holds shared types referenced by
  multiple features — `entity.User`, `entity.ID`.

### Import style

- **Go modules** (`go.mod` at root). No `GOPATH`, no `vendor/` unless required.
- **3 groups, blank-line separated**: stdlib / external / internal.
- **`internal/` for app code, `pkg/` for reusable lib code.** Never reach into
  another feature's internals via `internal/` — go through its exported
  interface.

```go
import (
    "context"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"

    "myapp/internal/user"
    "myapp/pkg/log"
)
```

### Handler / Controller pattern

The handler does **four things and only four**: parse the request, validate,
call the service, write the response. No business logic, no DB calls.

```go
// internal/user/handler.go
package user

type Handler struct {
    svc Service
}

func NewHandler(svc Service) *Handler { return &Handler{svc: svc} }

// Gin
func (h *Handler) Create(c *gin.Context) {
    var req CreateRequest
    if err := c.ShouldBindJSON(&req); err != nil {        // parse + validate in one step
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    u, err := h.svc.Create(c.Request.Context(), req)      // context threaded in
    if err != nil {
        respondError(c, err)                              // centralized mapping
        return
    }
    c.JSON(http.StatusCreated, gin.H{"data": toResponse(u)})
}

// Fiber equivalent — BodyParser + manual Validate
func (h *Handler) Create(c fiber.Ctx) error {
    var req CreateRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
    }
    if err := validate.Struct(req); err != nil {
        return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
    }
    u, err := h.svc.Create(c.Context(), req)
    if err != nil {
        return respondError(c, err)
    }
    return c.Status(http.StatusCreated).JSON(fiber.Map{"data": toResponse(u)})
}
```

- **Request/response structs (DTOs) ≠ entity structs** — `dto.go` defines
  `CreateRequest`/`Response`; the handler maps `entity.User` → `Response`.
  Never serialize the DB model directly (leaks internal fields, couples API to
  schema).
- **`c.Request.Context()` (Gin) / `c.Context()` (Fiber)** flows into every
  service call — cancellation and timeouts propagate.
- **Validation tags on the DTO, not the entity** —
  `Email string `json:"email" binding:"required,email"` (Gin uses `binding:`,
  Fiber needs `validate:` + an explicit `validate.Struct` call).

### Service pattern

Business logic lives behind an **interface + private struct + constructor**.
The interface makes the dependency injectable and testable.

```go
// internal/user/service.go
type Service interface {
    Get(ctx context.Context, id uuid.UUID) (entity.User, error)
    Create(ctx context.Context, req CreateRequest) (entity.User, error)
}

type service struct {
    repo   Repository
    logger *slog.Logger
}

func NewService(repo Repository, logger *slog.Logger) Service {
    return &service{repo: repo, logger: logger}
}

func (s *service) Create(ctx context.Context, req CreateRequest) (entity.User, error) {
    // business rules here — hashing, domain invariants, authorization checks
    u := entity.User{ID: uuid.New(), Email: req.Email}
    if err := s.repo.Create(ctx, u); err != nil {
        return entity.User{}, fmt.Errorf("user create: %w", err)
    }
    return u, nil
}
```

- **Interface defined in the consumer's package** (the feature folder), not a
  shared `interfaces/` dump — qiangxue defines `Service` and `Repository` in
  `internal/album`, right above their impls.
- **`ctx context.Context` is the first parameter of every method**, always.
- **Constructor `NewX(deps...) X`** — the one and only constructor pattern.

### Repository pattern

Data access behind an interface so the service depends on an abstraction, and
tests swap in a fake. Same shape as the service.

```go
// internal/user/repository.go
type Repository interface {
    Get(ctx context.Context, id uuid.UUID) (entity.User, error)
    Create(ctx context.Context, u entity.User) error
}
```

- **sqlc**: the interface wraps the generated `*sqlc.Queries`; write hand
  methods that delegate. GORM: the impl holds `*gorm.DB`.
- **`context.Context` passed through to every query** so `pgx`/`database/sql`
  can cancel/time out.
- **Parameterized queries only** — sqlc and GORM parameterize by construction;
  with `sqlx` use `$1`/`$2` placeholders, never `fmt.Sprintf` into SQL.

### Dependency injection

**Constructor injection, manual.** `main.go` wires the graph once at startup
and passes it down. No global singletons, no `init()` side effects.

```go
// cmd/api/main.go
func main() {
    cfg := config.Load()
    db := mustConnect(cfg.DB)
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    userRepo := user.NewRepository(db, logger)
    userSvc  := user.NewService(userRepo, logger)
    userH    := user.NewHandler(userSvc)

    r := router.New(userH, authH)
    r.Run(":" + cfg.Port)
}
```

- **Wire (codegen)** only when the graph grows past ~15 providers and manual
  wiring gets noisy — generates `wire_gen.go`, compile-time checked. No runtime
  reflection containers (uber/dig, fx) unless you need plugin-style init;
  they're runtime-failure and harder to trace.
- **gbrayhan uses `infrastructure/di`** as a single wiring point — acceptable
  for DDD layouts; the principle is "wire once, at the edge".

### Error handling

- **Wrap with `fmt.Errorf("...: %w", err)`** at each layer boundary — the
  caller can `errors.Is`/`errors.As` while the trace stays readable:
  `user create: repo exec: pq: unique constraint`.
- **Sentinel errors in `internal/errors/`** (qiangxue) or per-feature —
  `var ErrNotFound = errors.New("not found")`. Services return them;
  handlers map them to HTTP status in **one** centralized place.
- **Custom error type carrying a status code** (qiangxue `ErrorResponse`):

```go
// internal/errors/response.go
type AppError struct {
    Status  int    `json:"status"`
    Code    string `json:"code"`
    Message string `json:"message"`
}
func (e *AppError) Error() string { return e.Message }

var (
    ErrNotFound  = &AppError{Status: 404, Code: "not_found",        Message: "resource not found"}
    ErrConflict  = &AppError{Status: 409, Code: "already_exists",   Message: "resource already exists"}
    ErrForbidden = &AppError{Status: 403, Code: "forbidden",        Message: "not authorized"}
)
```

- **Centralized error middleware** maps the error to the response envelope —
  no per-handler `switch err`. Gin: an error-handling middleware reading
  `c.Errors`; Fiber: a recover + custom error handler via `app.ErrorHandler`.
- **Validation errors map to 400 with field-level details** (qiangxue
  `InvalidInput` returns `[]{field, error}`) — not a raw `err.Error()` dump.
- **Never leak internals** — DB errors, stack traces, internal IDs stay in
  logs; the response says only what the client needs.

### Response shape

Same envelope discipline as the TS backend rules — success and error are
mutually exclusive:

```go
// success
c.JSON(200, gin.H{"data": payload})
// error
c.JSON(status, gin.H{"error": gin.H{"code": "not_found", "message": "..."}})
```

### Configuration

Struct with tags, loaded once at startup. `caarlos0/env` for env-only, viper
for file+env+flags.

```go
// internal/config/config.go
type Config struct {
    Port string `env:"PORT" envDefault:"8080"`
    DB   DBConfig
    JWT  JWTConfig
}
type DBConfig struct {
    URL          string `env:"DATABASE_URL,required"`
    MaxOpenConns int    `env:"DB_MAX_OPEN_CONNS" envDefault:"25"`
}
func Load() Config {
    _ = godotenv.Load()                         // local .env, ignored in prod
    var cfg Config
    if err := env.Parse(&cfg); err != nil { log.Fatal(err) }
    return cfg
}
```

- **`.env.example` committed; `.env` gitignored.** Secrets via env or a secret
  manager, never hardcoded.
- **`config.Load()` is the only place env is read** — pass the struct down, no
  `os.Getenv` scattered in handlers.

## Database setup

### Choose one — GORM (fast CRUD) or sqlc (type-safe SQL)

**sqlc (recommended for new services):** write SQL in `queries/*.sql`,
generate Go in `internal/sqlc/`. No ORM magic, all SQL is visible and reviewable.

```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "queries/"
    schema: "migrations/"
    gen:
      go:
        package: "sqlc"
        out: "internal/sqlc"
        sql_package: "pgx/v5"
        emit_json_tags: true
        emit_empty_slices: true
```

```go
// internal/user/repository.go (sqlc)
type repository struct {
    q *sqlc.Queries   // generated
}
func (r *repository) Get(ctx context.Context, id uuid.UUID) (entity.User, error) {
    row, err := r.q.GetUser(ctx, id)   // generated from GetUser SQL
    return entity.User{ID: row.ID, Email: row.Email}, err
}
```

**GORM (faster to stand up, heavier):**

```go
// internal/user/repository.go (GORM)
type repository struct {
    db *gorm.DB
}
func (r *repository) Create(ctx context.Context, u entity.User) error {
    return r.db.WithContext(ctx).Create(&u).Error
}
```

### Connection pooling (pgx / database/sql)

```go
cfg, _ := pgxpool.ParseConfig(cfg.DB.URL)
cfg.MaxConns = 25                       // tune to DB capacity, not unlimited
cfg.MinConns = 5
cfg.MaxConnLifetime = time.Hour
cfg.MaxConnIdleTime = 30 * time.Minute
pool, err := pgxpool.NewWithConfig(ctx, cfg)
```

- **Set `MaxConns` explicitly** — default is `max(4, runtime.NumCPU())`, which
  may overshoot a small DB's connection limit.
- **`WithContext`** on every query — never `db.Create(&u)` without the context.
- **Health check endpoint hits `pool.Ping(ctx)`** — wired into the readiness
  probe and `/healthz`.

### Migrations (golang-migrate)

```
migrations/
├── 000001_create_users.up.sql
├── 000001_create_users.down.sql
├── 000002_add_user_status.up.sql
└── 000002_add_user_status.down.sql
```

- **Plain SQL, versioned, paired up/down** — no code-based migrations (harder
  to review, harder to reason about). goose allows Go-func migrations; prefer
  SQL unless a migration genuinely needs row-level logic.
- **Run via CLI in a container** (qiangxue pattern) or `make migrate-up` —
  never `migrate.Up()` on app boot in prod (race across replicas).
- **One change per file** — atomic, reversible.

```makefile
migrate-up:
	migrate -path migrations -database "$(DSN)" up
migrate-create:
	migrate create -ext sql -dir migrations -seq $(name)
```

## Key libraries

| Library | Import path | Use |
|---------|-------------|-----|
| Gin | `github.com/gin-gonic/gin` | HTTP framework |
| Fiber | `github.com/gofiber/fiber/v3` | HTTP framework (alt) |
| validator | `github.com/go-playground/validator/v10` | struct validation |
| GORM | `gorm.io/gorm` + `gorm.io/driver/postgres` | ORM |
| sqlc | `github.com/sqlc-dev/sqlc` (codegen, not imported) | type-safe SQL |
| pgx | `github.com/jackc/pgx/v5` | Postgres driver + pool |
| sqlx | `github.com/jmoiron/sqlx` | `database/sql` extension (alt to sqlc) |
| golang-migrate | `github.com/golang-migrate/migrate/v4` | DB migrations |
| goose | `github.com/pressly/goose/v3` | DB migrations (alt) |
| viper | `github.com/spf13/viper` | config (files+env) |
| env | `github.com/caarlos0/env/v11` | config (env-only structs) |
| godotenv | `github.com/joho/godotenv` | `.env` loader |
| testify | `github.com/stretchr/testify` | test assertions + mocks |
| golang-jwt | `github.com/golang-jwt/jwt/v5` | JWT auth |
| uuid | `github.com/google/uuid` | UUID generation |
| slog | `log/slog` (stdlib) | structured logging |
| zerolog | `github.com/rs/zerolog` | zero-alloc logging (alt) |
| cors | `github.com/gin-contrib/cors` / `github.com/gofiber/contrib/cors` | CORS middleware |
| swag | `github.com/swaggo/swag` + `gin-swagger` | OpenAPI from annotations |
| air | `github.com/air-verse/air` | live reload (dev) |

`log/slog` is stdlib since Go 1.21 — prefer it for new services; reach for
zerolog only if benchmarks show slog's allocation matters.

## Dev commands

```bash
go run ./cmd/api                    # run locally (point at the entry main.go)
go run ./cmd/seed                   # run a second binary (e.g. seeding)
go build -o bin/api ./cmd/api       # build a static-ish binary
go test ./...                       # all tests
go test -race -cover ./...          # race detector + coverage
go test ./internal/user -run TestCreate -v   # one package, one test
golangci-lint run ./...             # lint (CI gate)
golangci-lint run --fix             # autofix what's autofixable
go fmt ./... && go vet ./...        # format + baseline vet
go mod tidy                         # sync go.mod/go.sum
sqlc generate                       # regenerate DB code from queries/*.sql
air                                 # live reload on file change (dev)
swag init -g cmd/api/main.go -o docs  # regenerate OpenAPI from annotations
```

Typical `Makefile` targets (from chuanghiduoc / qiangxue):

```makefile
run:        ; go run ./cmd/api
build:      ; CGO_ENABLED=0 go build -ldflags="-s -w" -trimpath -o bin/api ./cmd/api
test:       ; go test -race -cover ./...
test-integration: ; go test -tags=integration -count=1 ./...
lint:       ; golangci-lint run ./...
fmt:        ; go fmt ./... && go vet ./...
migrate-up: ; migrate -path migrations -database "$(DSN)" up
migrate-create: ; migrate create -ext sql -dir migrations -seq $(name)
sqlc:       ; sqlc generate
swagger:    ; swag init -g cmd/api/main.go -o docs
watch:      ; air
docker-up:  ; docker compose up --build
```

## Deployment notes

- **Single static binary** — `CGO_ENABLED=0 go build` produces a binary with no
  libc dependency; ship the binary alone if the host has the right arch/OS.
- **Multi-stage Dockerfile** — build in `golang:<ver>-alpine`, run in
  `alpine` (or `scratch` with ca-certificates + tzdata copied in). Copy
  `migrations/` and `docs/` in if the runtime needs them. Run as a non-root
  user. Pattern from chuanghiduoc:

```dockerfile
# build
FROM golang:1.24-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -trimpath -o server ./cmd/api

# run
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /app/server ./server
COPY --from=build /app/migrations ./migrations
USER app
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8080/healthz || exit 1
CMD ["./server"]
```

- **`scratch` base** is the smallest option — copy `/etc/ssl/certs/ca-certificates.crt`
  and `/usr/share/zoneinfo` in explicitly. Trade-off: no shell for debugging.
- **Migrations run as a separate init step** (CI job, `migrate up` in an init
  container), not on app boot — avoids two replicas racing the same migration.
- **Config via env vars** in the container — no config files baked into the image.
- **Graceful shutdown** — `http.Server.Shutdown(ctx)` on `SIGTERM`; Fiber has
  `app.ShutdownWithTimeout`. Finish in-flight requests, close the DB pool, exit.
- **Health/readiness split** — `/healthz` (liveness, always 200 if the process
  is up) vs `/readyz` (readiness, 200 only when the DB pool pings). Wire the
  readiness probe to `pgxpool.Ping`.
