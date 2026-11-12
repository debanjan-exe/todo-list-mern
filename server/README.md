# To-Do API (server)

Express + MongoDB REST API for the To-Do List app, with sign up / sign in (JWT). Main guide: [`../README.md`](../README.md).

## Run

```bash
cp .env.example .env   # set MONGO_URI and JWT_SECRET
pnpm install
pnpm dev               # http://localhost:5000 (restarts on file change)
pnpm start             # production
pnpm test              # unit tests (Vitest)
pnpm test:watch        # unit tests, re-run on save
```

| Variable | Example | Meaning |
|---|---|---|
| `PORT` | `5000` | Port of the API |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/todo-app` | MongoDB connection string |
| `CLIENT_URL` | `*` or the Netlify URL | Origin allowed by CORS |
| `JWT_SECRET` | a long random string | Signs the login tokens. **Required**: the server stops without it |
| `JWT_EXPIRES_IN` | `7d` | How long a sign-in lasts |
| `TEST_USER_ENABLED` | `true` | Make the demo account on start and give it to the Sign In screen. Use `false` in production |
| `TEST_USER_NAME` / `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` | `Test User` / `test@todo.app` / `Test@1234` | Demo account details |

## Structure: controller → service → data

```
src/
├── index.js                       # Load .env, check JWT_SECRET, listen, connect DB (retry), ensure test user
├── app.js                         # Express app: cors, json, /api/health, /api/auth, /api/tasks (requireAuth), errorHandler
├── config/db.js                   # connectWithRetry (every 5 s), dbState, pingDb
├── routes/
│   ├── healthRoutes.js            # GET /api/health
│   ├── authRoutes.js              # POST /signup, POST /signin, GET|PUT|DELETE /me, GET /test-user
│   └── taskRoutes.js              # task CRUD
├── controllers/                   # CONTROLLER  HTTP only: req → service → res
│   ├── authController.js
│   ├── healthController.js        # 200 when OK, 503 when something is down
│   └── taskController.js          # passes req.userId to the service
├── services/                      # SERVICE     business rules, no req/res, no queries
│   ├── authService.js             # bcrypt hash/compare, JWT create/verify, safe user object, test user
│   ├── healthService.js           # api / database (ping) / auth / testUser checks
│   └── taskService.js             # id check, search, protected fields, 404
├── data/                          # DATA        the only files with MongoDB queries
│   ├── userData.js                # active-only finds, updateUserById, markUserDeleted, upsertTestUser, prepareUserCollection
│   └── taskData.js                # every query: { user: userId, isDeleted: false }
├── models/                        # MODEL       Mongoose schemas
│   ├── User.js                    # name, email (unique among active), password hash, isTestUser (only one), isDeleted
│   └── Task.js                    # user (owner), title, dateTime, ..., isDeleted
├── middleware/
│   ├── auth.js                    # requireAuth: "Bearer <token>" → req.userId, else 401
│   └── errorHandler.js            # errors → { message } + status
└── utils/
    ├── asyncHandler.js            # sends async errors to the error handler (no try/catch)
    └── errors.js                  # BadRequest 400, Unauthorized 401, NotFound 404, Conflict 409
```

```
Request → app.js → [requireAuth] → route → controller → service → data → model → MongoDB
Error in any layer → errorHandler → 400 / 401 / 404 / 409 / 500
```

| Layer | Does | Does not |
|---|---|---|
| Controller | Read `req`, call the service, send status + JSON | Query the database, hold rules |
| Service | Validate input, hash passwords, make tokens, scope to the user, throw HTTP errors | Touch `req` / `res`, run queries |
| Data | Run the queries (`findTasks`, `insertTask`, `findUserByEmail`, …) | Hold business rules |
| Model | Fields, types, required, enums, defaults | Anything else |

## Auth

- **Sign up:** checks the fields (password ≥ 6 characters), refuses a used email (409), stores a **bcrypt hash**, returns `{ token, user }`.
- **Sign in:** compares the hash. An unknown email and a wrong password give the same 401 message.
- **Token:** JWT `{ id }` signed with `JWT_SECRET`. The client sends `Authorization: Bearer <token>`.
- **Personal access tokens** (`todo_pat_…`, for AI clients): `requireAuth` sees the prefix, hashes the token (sha256) and finds it in `AccessToken`. It sets `req.authType = 'access-token'` (a JWT gives `'session'`). `/api/tokens` refuses access tokens (403).
- **Ownership:** tasks get `user = req.userId` on create. The service ignores any `user` field in the body. Another user's task gives 404.

## Server status and the test user

- The server **starts listening first**, then connects to MongoDB and tries again every 5 s. So `GET /api/health` can answer "database: down" instead of the API being unreachable.
- `GET /api/health` returns `200` (`status: "ok"`) when the database and auth are up, else `503` (`status: "error"`). Each check has `status` (`up` / `down` / `warn` / `off`) and a `message`. The database check also has `latencyMs` (ping time).
- **Test user:** after each connect, `ensureTestUser()` upserts the user with `isTestUser: true` (same document every time) and resets its password. A **unique partial index** (`isTestUser` where `true`) blocks a second test user. If a normal account already has `TEST_USER_EMAIL`, the server logs a warning and leaves it alone.
- `GET /api/auth/test-user` returns the demo email and password (404 when `TEST_USER_ENABLED=false`).

## Profile and account delete

- `PUT /api/auth/me { name }` changes only the name (1–50 characters). The email is the sign-in id and is ignored.
- `DELETE /api/auth/me` is a **soft delete**: `isDeleted: true`, `deletedAt` set. Nothing is removed; the tasks stay (hidden).
- `requireAuth` also checks that the account is still active, so a deleted account's token gets `401` on the next request.
- The test account cannot be deleted (`403`).
- On each connect, `prepareUserCollection()` gives old accounts `isDeleted: false` and runs `User.syncIndexes()` (replaces the old "email unique" index with "email unique among active accounts").

## Soft delete

- Tasks are **never removed**. `DELETE /api/tasks/:id` sets `isDeleted: true` and `deletedAt`.
- `data/taskData.js` adds `isDeleted: false` to every query.
- To see deleted tasks: `mongosh todo-app --eval 'db.tasks.find({ isDeleted: true })'`

## OAuth (one-click Connect from Claude)

`services/oauthService.js`, `controllers/oauthController.js`, `routes/oauthRoutes.js`. A simple version of Retainia's MCP OAuth:

1. `/mcp` without a token → 401 with `WWW-Authenticate: Bearer resource_metadata=".../.well-known/oauth-protected-resource"`.
2. Claude reads `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server`.
3. `POST /oauth/register` → `client_id` = signed JWT (name + redirect URIs). Only `claude.ai`, `claude.com`, `localhost` (+ `OAUTH_REDIRECT_HOSTS`).
4. `GET /oauth/authorize` → checks client, redirect URI, PKCE S256 → 302 to `APP_URL/oauth/authorize?<same query>`.
5. The app's consent page (signed in) → `POST /api/oauth/authorize` → redirect URL with a one-time code (JWT, 5 min).
6. `POST /oauth/token` (form) → checks code, client, redirect URI, PKCE → `access_token` = a personal access token (`oauthClient` set, one per app).

OAuth JWTs use `JWT_SECRET + ":oauth"`, so they never work as a sign-in session. `trust proxy` is on, so URLs are `https` on Render.

## MCP server (`POST /mcp`)

- `routes/mcpRoutes.js` → `controllers/mcpController.js` → `mcp/createMcpServer.js` → `mcp/tools.js`.
- Streamable HTTP, **stateless**: a new `McpServer` + transport for each request, for `req.userId`. JSON answers (`enableJsonResponse`). `GET` / `DELETE` → 405.
- 8 tools: `get_profile`, `list_tasks`, `search_tasks`, `create_task`, `update_task`, `complete_task`, `delete_task`, `weekly_summary`. They call `taskService` / `authService`, so the rules are the same as the REST API.
- `run()` in `tools.js` turns a 4xx service error into an MCP tool error (`isError: true`). Other errors go to `errorHandler`.
- Packages: `@modelcontextprotocol/sdk`, `zod` (tool input schemas).

## Tests

`pnpm test` → 55 tests (Vitest). No database is needed.

### Unit (`tests/unit/`, 40 tests)

Each file mocks the layer below with `vi.mock(...)`. Each test file mocks the layer below with `vi.mock(...)`:

- `taskService.test.js`, `authService.test.js`: the **data layer** is mocked → only the business rules are tested.
- `healthService.test.js`: `config/db.js` and the data layer are mocked → up / down / warn cases.
- `middleware.test.js`: `requireAuth` and `errorHandler` are called with fake `req` / `res` / `next`.

### Integration (`tests/integration/`, 15 tests)

`oauth.test.js` (6): the full one-click Connect flow, like Claude does it.

`mcp.test.js` (9):

Starts the **real Express app** on a free port and talks to it with `fetch` and the official **MCP SDK client** (`StreamableHTTPClientTransport`). Only the data layer is replaced by `tests/helpers/memoryData.js` (in-memory users, tasks, tokens with the same rules). Checks access tokens (hash only, 403 for token management, revoke), `/mcp` 401 without a token, the tool list, a full create → list → complete → search → summary → delete flow, tool errors and user isolation.

`vitest.config.js` sets `JWT_SECRET=test-secret` for the tests.

## Endpoints

| Method | Endpoint | Auth | Success | Errors |
|---|---|---|---|---|
| POST | `/api/auth/signup` | – | 201 `{ token, user }` | 400, 409 |
| POST | `/api/auth/signin` | – | 200 `{ token, user }` | 400, 401 |
| GET | `/api/auth/me` | token | 200 `{ user }` | 401 |
| PUT | `/api/auth/me` | token | 200 `{ user }` | 400, 401 |
| DELETE | `/api/auth/me` | token | 200 `{ message }` (soft delete) | 401, 403 |
| GET | `/api/tasks?search=word` | token | 200 list (earliest first) | 401 |
| GET | `/api/tasks/:id` | token | 200 task | 401, 404 |
| POST | `/api/tasks` | token | 201 task | 400, 401 |
| PUT | `/api/tasks/:id` | token | 200 task | 400, 401, 404 |
| DELETE | `/api/tasks/:id` | token | 200 `{ message, id }` | 401, 404 |
| GET | `/api/tokens` | session JWT | 200 list (no full token) | 401, 403 |
| POST | `/api/tokens` | session JWT | 201 `{ ..., token }` (shown once) | 400, 401, 403 |
| DELETE | `/api/tokens/:id` | session JWT | 200 `{ message }` (soft delete) | 401, 403, 404 |
| GET | `/.well-known/oauth-protected-resource[/mcp]` | – | 200 metadata | – |
| GET | `/.well-known/oauth-authorization-server` | – | 200 metadata | – |
| POST | `/oauth/register` | – | 201 `{ client_id, ... }` | 400 |
| GET | `/oauth/authorize` | – | 302 to the consent page | 400 |
| POST | `/oauth/token` | – | 200 `{ access_token, token_type }` | 400 |
| GET | `/api/oauth/authorize/info` | session JWT | 200 `{ clientName, denyUrl }` | 400, 401, 403 |
| POST | `/api/oauth/authorize` | session JWT | 200 `{ redirectUrl }` | 400, 401, 403 |
| POST | `/mcp` | token or access token | MCP JSON-RPC answer | 401 (+ `WWW-Authenticate`) |
| GET / DELETE | `/mcp` | token | – | 405 |
| GET | `/api/health` | – | 200 all OK | 503 something down |
| GET | `/api/auth/test-user` | – | 200 `{ email, password }` | 404 turned off |
| GET | `/` | – | 200 "API is running" | – |

> Tasks made before accounts were added have no `user`, so they do not show for any user.
