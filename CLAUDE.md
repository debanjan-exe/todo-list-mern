# CLAUDE.md – guide for AI coding agents

This file tells an AI agent (Claude Code, Codex, Cursor and others) how this repository works.
Read it before you change code. Humans: see `README.md` for the full story.

## What this is

A mobile-first MERN To-Do List app (assessment project).

- `client/` – React 18 + Vite 5 + MUI v6 (Netlify)
- `server/` – Node + Express 4 + Mongoose 8 (Render), MongoDB Atlas
- `server/src/mcp/` – an MCP server at `POST /mcp`, so Claude can manage a user's tasks
- Package manager: **pnpm 10** (not npm or yarn). Each of `client/` and `server/` has its own `package.json` and `pnpm-lock.yaml`.

## Commands

```bash
# server (needs server/.env: MONGO_URI, JWT_SECRET, CLIENT_URL, TEST_USER_*)
cd server && pnpm install && pnpm dev     # http://localhost:5000
cd server && pnpm test                    # Vitest, unit + MCP integration (no MongoDB needed)

# client (needs client/.env: VITE_API_URL=http://localhost:5000/api)
cd client && pnpm install && pnpm dev     # http://localhost:5173
cd client && pnpm test                    # Vitest + React Testing Library (jsdom)
cd client && pnpm build                   # must pass before a commit
```

Render installs with `pnpm install --frozen-lockfile --prod`. When you add a dependency, **commit the updated `pnpm-lock.yaml`**, or the deploy fails.

## Server: strict layers

```
route → (requireAuth) → controller → service → data → model
```

| Layer | Folder | Does | Does NOT |
|---|---|---|---|
| route | `src/routes/` | URL + method → controller | logic |
| controller | `src/controllers/` | read `req`, call a service, send `res` (wrapped in `asyncHandler`) | database calls, rules |
| service | `src/services/` | business rules, validation, throws `HttpError`s | touch `req`/`res` |
| data | `src/data/` | the ONLY place that calls Mongoose | rules |
| model | `src/models/` | Mongoose schemas and indexes | – |

- Errors: throw `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError` from `src/utils/errors.js`. `middleware/errorHandler.js` turns them into `{ message }` JSON.
- `src/app.js` builds the Express app (tests import it). `src/index.js` starts it and connects to MongoDB with retry.
- MCP tools (`src/mcp/tools.js`) call the **same services** as the REST controllers. Never put rules in a tool.

## Rules you must keep

1. **User scope.** Every task query includes the user id. The data layer takes `userId` as the first argument. A user must never see or change another user's data.
2. **Soft delete everywhere.** Never call `deleteOne` / `findByIdAndDelete`. Set `isDeleted: true, deletedAt: new Date()`. Every read filters `isDeleted: false`. This applies to users, tasks and access tokens.
3. **Unique indexes are partial** (`isDeleted: false`), so a deleted email can sign up again. Only one `isTestUser` is allowed.
4. **Weeks start on Monday** (dayjs `en-gb` locale on the client, the same in MCP instructions).
5. **Auth** (`middleware/auth.js`): `Authorization: Bearer <token>`.
   - A JWT (from sign in) → `req.authType = 'session'`.
   - A personal access token (`todo_pat_…`) → `req.authType = 'access-token'`. Only the sha256 hash is stored. The full token is returned one time on create.
   - Token management (`/api/tokens`) needs a `session`, so an AI client cannot make more tokens.
6. **No secrets in code.** `.env` files are git-ignored. Do not commit tokens, passwords or connection strings.

## MCP server

- `POST /mcp`, Streamable HTTP, **stateless** (`sessionIdGenerator: undefined`, `enableJsonResponse: true`): a new `McpServer` for each request, made for `req.userId`. `GET` and `DELETE /mcp` return 405.
- Files: `routes/mcpRoutes.js` → `controllers/mcpController.js` → `mcp/createMcpServer.js` (server instructions) → `mcp/tools.js`.
- Tools: `get_profile`, `list_tasks`, `search_tasks`, `create_task`, `update_task`, `complete_task`, `delete_task` (destructive, soft delete), `weekly_summary`.
- To add a tool: add a service function (with a unit test), then `server.registerTool(name, { title, description, inputSchema: { zod fields }, annotations }, handler)` in `tools.js`, using `run()` so 4xx errors become `isError` tool results. Add it to the tool list test in `tests/integration/mcp.test.js`.
- Dates in tools: ISO 8601 **with** the time zone offset.

## Client

- Entry: `main.jsx` (theme, dayjs `LocalizationProvider`, router) → `App.jsx`: `MobileFrame → ErrorBoundary → ServerGate → AuthProvider → AppRoutes`.
- `routes/PublicRoutes.jsx` (sign in / sign up) and `routes/PrivateRoutes.jsx` (`TaskProvider`, `/home /weeks /search /profile`, `BottomNav`).
- All HTTP calls are in `src/api.js`. The session JWT is in `localStorage` (`todo_token`). A 401 signs the user out.
- State: `context/AuthContext.jsx` (user) and `context/TaskContext.jsx` (tasks, task sheet, toast `notify()`, `confirm()` dialog).
- UI: MUI only (no Tailwind). Square-ish corners (`borderRadius: '2px'`), colors from `theme.js` (`colors`). Layouts use `100dvh` and `env(safe-area-inset-bottom)` for iPhone.
- Pickers are custom dialogs in `components/pickers/` (time wheels, calendar).
- Use `confirm()` from `useTasks()` before any delete. Use `notify()` for errors.

## Tests

- Vitest in both apps. `vi.mock` the layer below the code under test.
- `server/tests/unit/` – services and middleware.
- `server/tests/integration/mcp.test.js` – the real Express app + the official MCP SDK client; only the data layer is replaced by `tests/helpers/memoryData.js`.
- `client/tests/unit/` – components and utils; `tests/setup.js` (jest-dom, storage polyfill for Node 25), `tests/renderWithProviders.jsx`.
- In `beforeEach`, use braces: `beforeEach(() => { fn.mockReset(); })`. A returned value is run as cleanup.
- Run both test suites and `pnpm build` in `client/` before you say a change is done.

## Code style

- ES modules, 2-space indent, single quotes, semicolons.
- Comments are short and in simple English (ASD-STE100 style): one idea per sentence, active voice, explain **why**.
- Keep the code easy to explain in a presentation: small functions, clear names, no clever tricks.
- Update `README.md` (and `server/README.md` / `client/README.md`) when you add an endpoint, a tool, a screen or tests.
