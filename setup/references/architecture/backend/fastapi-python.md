# FastAPI + Python (Backend)

Opinionated production stack distilled from the two highest-signal FastAPI
references in the ecosystem:

- **tiangolo/full-stack-fastapi-template** (~44.7k★) — the official full-stack
  starter. Synchronous **SQLModel**, Python 3.14, `uv`, Ruff + mypy, pytest.
- **fastapi-practices/fastapi_best_architecture** (~2.5k★) — async
  **SQLAlchemy 2.0**, modular per-domain layout, unified response envelope,
  custom exception handlers, RBAC.

Where they diverge we pick a side and say why.

## Recommended stack components

| Layer | Pick | Notes |
|---|---|---|
| Runtime | **Python 3.12+** (3.14 fine) | tiangolo already pins `>=3.14`; 3.12 is the safe floor for `tomllib`, PEP 695 generics, `Self`. |
| Framework | **FastAPI** (`fastapi[standard]`) | the `[standard]` extra pulls `uvicorn`, `httptools`, `python-multipart`. |
| ASGI server (dev) | **uvicorn** | `uvicorn app.main:app --reload` |
| ASGI server (prod) | **gunicorn -k uvicorn.workers.UvicornWorker** | process management + graceful reload; gunicorn manages N uvicorn workers. |
| ORM | **SQLModel** *or* **SQLAlchemy 2.0 (async)** | SQLModel = SQLAlchemy models + Pydantic in one class (tiangolo's choice, sync). Plain SQLAlchemy 2.0 async = full power, no Pydantic merging (best-architecture's choice). Pick one per project. |
| Validation | **Pydantic v2** | built into FastAPI; do not install Pydantic v1. |
| Async DB driver | **asyncpg** (Postgres) / **asyncmy** (MySQL) | only when ORM is async. Sync path uses **psycopg 3** (`postgresql+psycopg`). |
| Settings | **pydantic-settings** (`BaseSettings`) | typed `.env` loading, validators, computed fields. |
| Migrations | **Alembic** | the only mature option; never `create_all()` in prod. |
| Linter | **Ruff** | replaces flake8 + isort + bugbear in one tool. |
| Formatter | **Ruff format** (or **Black**) | Ruff format is Black-compatible; one fewer dep. |
| Type checker | **mypy** (`strict=true`) *or* **pyright/ty** | tiangolo uses strict mypy; best-architecture uses `ty`. mypy is the ecosystem default. |
| Test | **pytest + httpx** | `httpx.AsyncClient` for `ASGITransport` in-process tests. |
| Package manager | **uv** | trending fastest — Rust, 10–100× Poetry's resolve, tiangolo's Dockerfile uses it. Poetry still fine on legacy projects; new projects → **uv**. |
| Caching / queue | **Redis** (`redis` async) / **Celery** (best-architecture has a `task/` app) | optional, add when needed. |
| Obs / tracing | **Sentry SDK** (`sentry-sdk[fastapi]`), Prometheus, OpenTelemetry | tiangolo wires Sentry; best-architecture ships OTel + Prometheus middleware. |

## Folder structure

Two proven shapes. **Start with the flat one** unless you have >3 domains.

### A. Flat / single-app (tiangolo) — recommended default

```
backend/
├── pyproject.toml
├── Dockerfile
├── .env
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
└── app/
    ├── __init__.py
    ├── main.py              # FastAPI() app instance, middleware, router include
    ├── api/
    │   ├── __init__.py
    │   ├── main.py          # api_router aggregates all route modules
    │   ├── deps.py          # SessionDep, CurrentUser, get_db, get_current_user
    │   └── routes/
    │       ├── __init__.py
    │       ├── users.py
    │       ├── items.py
    │       └── login.py
    ├── core/
    │   ├── __init__.py
    │   ├── config.py        # Settings(BaseSettings)
    │   ├── db.py            # engine, init_db()
    │   └── security.py      # hashing, jwt helpers
    ├── models.py            # SQLModel tables + Read/Create/Update schemas in one file
    ├── crud.py              # db access functions per entity
    └── utils.py
```

### B. Modular per-domain (best-architecture) — when one app has many bounded contexts

```
backend/
├── pyproject.toml
├── main.py                  # builds & launches app via register_app()
├── alembic/{env.py,versions/}
├── database/
│   ├── db.py                # async engine, async_sessionmaker, get_db deps
│   └── redis.py
├── app/                     # the application modules
│   ├── admin/
│   │   ├── api/v1/sys/user.py   # routers only — thin
│   │   ├── service/user_service.py
│   │   ├── crud/crud_user.py
│   │   ├── model/user.py
│   │   └── schema/user.py       # Pydantic request/response
│   └── task/                # Celery, scheduler, beat
├── common/                  # cross-cutting: response envelope, exception handlers, log, security, pagination
│   ├── response/response_schema.py
│   ├── exception/{errors.py,exception_handler.py}
│   ├── security/{jwt.py,permission.py,rbac.py}
│   ├── pagination.py
│   └── log.py
└── core/conf.py             # settings
```

Rule of thumb: one route module per resource, one service/crud per entity.
Never a single `routes.py` accumulating every endpoint.

## Conventions

### Import style

- **Absolute imports** from the package root (`app.` or `backend.`), never
  relative `..` chains. Both templates configure `src`/root so `from app.api.deps import CurrentUser` resolves.
- `__init__.py` files are empty markers — they exist so the package imports,
  they do **not** re-export or run code. tiangolo's `app/__init__.py`,
  `api/__init__.py`, `routes/__init__.py` are all empty.
- Package root is whatever `pyproject.toml` declares. tiangolo = `backend/app/`
  (import root `app.`); best-architecture = `backend/` (import root `backend.`).

### Router pattern

One `APIRouter` per resource file, grouped by tag and prefix; an
`api/main.py` aggregates them:

```python
# app/api/routes/items.py
from fastapi import APIRouter
router = APIRouter(prefix="/items", tags=["items"])

# app/api/main.py
from fastapi import APIRouter
from app.api.routes import items, login, users
api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(items.router)

# app/main.py
app.include_router(api_router, prefix=settings.API_V1_STR)  # e.g. /api/v1
```

`custom_generate_unique_id` on the app gives stable operation IDs in the
OpenAPI doc: `f"{route.tags[0]}-{route.name}"`.

### Pydantic schemas

**Where they live depends on the ORM choice:**

- **SQLModel (tiangolo):** the table class and its `Read`/`Create`/`Update`
  variants all live together in `app/models.py`. SQLModel subclasses
  `SQLModel, table=True` for tables; plain `SQLModel` for the IO shapes:

  ```python
  class Item(SQLModel, table=True):        # the DB row
      id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
      title: str
      owner_id: uuid.UUID

  class ItemCreate(SQLModel):              # request body
      title: str
  class ItemPublic(SQLModel):              # response
      id: uuid.UUID
      title: str
  class ItemUpdate(SQLModel):              # PATCH body
      title: str | None = None
  ```

- **Plain SQLAlchemy 2.0 (best-architecture):** tables in `model/`, Pydantic
  IO in `schema/`. Never merge them — SQLAlchemy models are not Pydantic.

Set `response_model=` on every route (`@router.get("/{id}", response_model=ItemPublic)`)
so FastAPI strips fields the client shouldn't see.

### Dependency injection

FastAPI DI is `Depends`. Create reusable annotated aliases in `api/deps.py`
so routes stay short:

```python
# app/api/deps.py
from typing import Annotated
from collections.abc import Generator
from fastapi import Depends
from sqlmodel import Session
from app.core.db import engine

def get_db() -> Generator[Session]:
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_db)]
```

Then `def read_items(session: SessionDep, ...)` — no `Depends()` at the call
site. The same pattern injects auth (`CurrentUser = Annotated[User, Depends(get_current_user)]`),
RBAC, pagination, etc. DB session is request-scoped: one session per request,
closed in the `finally`/context-exit. Auth deps compose: `get_current_active_superuser`
depends on `CurrentUser`, which depends on `SessionDep`.

### Error handling

- Raise `HTTPException(status_code=404, detail="...")` from routes for simple
  cases. tiangolo's `B904` is **ignored** in Ruff specifically so you can raise
  HTTPException without `from e`.
- For a unified envelope across the whole API, register **custom exception
  handlers** on the app (best-architecture's pattern in
  `common/exception/exception_handler.py`):

  ```python
  @app.exception_handler(RequestValidationError)
  async def validation_handler(request, exc):
      return JSONResponse(status_code=422, content={"code": 422, "msg": ..., "data": None})
  ```

  Register handlers for `RequestValidationError`, `ValidationError`,
  `StarletteHTTPException`, and your own `BaseExceptionError`. This is the
  FastAPI equivalent of centralized error-handler middleware.

### Settings / config

`pydantic-settings` `BaseSettings`, one instance imported everywhere as
`settings`:

```python
# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, computed_field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+psycopg", username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD, host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT, path=self.POSTGRES_DB,
        )

settings = Settings()
```

Secrets come from `.env` (gitignored) or real env vars — `BaseSettings` reads
both. Compose the DSN in a `@computed_field` so the env stays simple.

### Async

- **Sync route + sync ORM** (tiangolo): plain `def` handlers, sync `Session`,
  `postgresql+psycopg`. Simplest; FastAPI runs sync `def` handlers in a
  threadpool so they don't block the event loop.
- **Async everywhere** (best-architecture): `async def` handlers, async
  `AsyncSession` + `asyncpg`, `async with session.begin()` for transactions.
  Required if you `await` other I/O (HTTP clients, Redis) in the handler — a
  sync handler awaiting nothing buys you nothing.

Do **not** mix: a sync DB call inside an `async def` handler blocks the event
loop. Either go fully async or use the sync `def` + threadpool pattern.
`expire_on_commit=False` and `autoflush=False` on the async sessionmaker are
the standard settings.

## Database setup

### Engine + session (SQLModel / sync)

```python
# app/core/db.py
from sqlmodel import Session, create_engine
from app.core.config import settings

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))

def get_db():
    with Session(engine) as session:
        yield session
```

### Engine + session (SQLAlchemy 2.0 / async)

```python
# backend/database/db.py
from sqlalchemy.ext.asyncio import (
    AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine,
)

def create_engine_for(url) -> AsyncEngine:
    return create_async_engine(
        url, echo=settings.DATABASE_ECHO, future=True,
        pool_size=10, max_overflow=20, pool_timeout=30,
        pool_recycle=3600, pool_pre_ping=True,
    )

async_engine = create_engine_for("postgresql+asyncpg://...")
async_db_session = async_sessionmaker(
    bind=async_engine, class_=AsyncSession,
    autoflush=False, expire_on_commit=False,
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_db_session() as session:
        yield session

async def get_db_transaction() -> AsyncGenerator[AsyncSession, None]:
    async with async_db_session.begin() as session:   # commits on success
        yield session
```

`pool_pre_ping=True` is standard — prevents "stale connection" errors on
long-lived workers. Expose session deps as `CurrentSession =
Annotated[AsyncSession, Depends(get_db)]` so routes read clean.

### Alembic

- `alembic init alembic` once; configure `alembic.ini` `script_location` and
  point `sqlalchemy.url` at your DB (best-architecture sets it dynamically in
  `env.py` from `settings`).
- In `alembic/env.py`, set `target_metadata = SQLModel.metadata` (tiangolo)
  or `MappedBase.metadata` (best-architecture) so autogenerate works. The
  async template uses `async_engine_from_config` + `connection.run_sync(...)`.
- **Import all model modules before autogenerate** — Alembic can only see
  tables that are imported. Both repos flag this gotcha.
- Flow: change a model → `alembic revision --autogenerate -m "desc"` → review
  the file → `alembic upgrade head`. Never run `create_all()` in prod; the
  init scripts in both repos have it commented out on purpose.

## Key libraries

| Lib | Role |
|---|---|
| `fastapi[standard]` | web framework + bundled uvicorn/httptools |
| `uvicorn` / `gunicorn` | ASGI server (dev / prod) |
| `sqlmodel` | ORM + Pydantic in one (sync default) |
| `sqlalchemy[asyncio]` | ORM (async full-power path) |
| `asyncpg` / `asyncmy` / `psycopg[binary]` | DB drivers (async pg / async mysql / sync pg) |
| `pydantic` + `pydantic-settings` | validation + typed env config |
| `alembic` | schema migrations |
| `ruff` | lint + format |
| `mypy` (strict) | static typing |
| `pytest` + `httpx` | tests, in-process ASGI calls |
| `python-jose` / `pyjwt` | JWT auth (tiangolo uses `pyjwt`) |
| `pwdlib[argon2,bcrypt]` | password hashing (modern replacement for passlib) |
| `tenacity` | retry/backoff for flaky external calls |
| `sentry-sdk[fastapi]` | error reporting / tracing |
| `redis` | cache / rate limit / pub-sub (async) |
| `celery` | background jobs (only if the project needs a worker) |

## Dev commands

```bash
# env / deps (uv — recommended)
uv sync                                      # install from pyproject.lock
uv add fastapi[standard] sqlmodel alembic    # add a dep
uv run uvicorn app.main:app --reload         # dev server, auto-reload
uv run alembic revision --autogenerate -m "add items"
uv run alembic upgrade head

# legacy (Poetry)
poetry install
poetry add fastapi
poetry run uvicorn app.main:app --reload

# quality
ruff check .                                 # lint
ruff format .                                # format (Black-compatible)
mypy app                                     # strict type check

# test
pytest                                       # all
pytest tests/api/test_items.py -k read_item  # one test
pytest --cov=app --cov-report=term-missing   # coverage
```

FastAPI exposes interactive docs out of the box at `/docs` (Swagger) and
`/redoc` (ReDoc), served from the `openapi_url` (tiangolo:
`{API_V1_STR}/openapi.json`).

## Deployment notes

- **Docker.** tiangolo's Dockerfile installs `uv` from
  `ghcr.io/astral-sh/uv:0.9.x`, sets `UV_COMPILE_BYTECODE=1`,
  `UV_LINK_MODE=copy`, `PATH="/app/.venv/bin:$PATH"`, and builds the venv in
  one layer copied into the final image. Base image `python:3.14`.
- **Process model.** Single uvicorn for dev; in prod run uvicorn workers
  under gunicorn for graceful restarts and signal handling:
  ```bash
  gunicorn app.main:app \
    -k uvicorn.workers.UvicornWorker \
    -w 4 --bind 0.0.0.0:8000 \
    --graceful-timeout 30 --timeout 120
  ```
  Workers = roughly `(2 × CPU) + 1`. Each worker is a separate process with
  its own DB pool — size `pool_size`/`max_overflow` with `workers × pool` in
  mind, not just per-worker.
- **Run behind a reverse proxy** (nginx / Caddy / a load balancer). uvicorn
  is the app server, not the edge.
- **Non-root user, readonly filesystem where possible, multi-stage build** to
  keep the final image small and free of build toolchain.
- **Health & readiness.** Add a `/health` (liveness) and a `/ready` (DB ping)
  route; the orchestrator probes them.
- **Config via env, not files baked into the image.** `BaseSettings` reads
  env at import; inject secrets through the platform's secret manager, not
  committed `.env`.
- **Migrations at deploy time**, not at app startup: `alembic upgrade head`
  as a pre-rollout step (init container / release task). Running migrations
  concurrently across N workers is a footgun.
- **Observability.** Wire Sentry (`sentry_sdk.init(dsn=..., enable_tracing=True)`,
  gated so dev is excluded), structured JSON logs, request-ID middleware, and
  Prometheus/OTel if the project needs metrics or distributed tracing.
