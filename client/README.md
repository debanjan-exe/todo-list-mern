# To-Do App (client)

React + Vite + MUI mobile UI for the To-Do List app. Main guide: [`../README.md`](../README.md).

## Run

```bash
cp .env.example .env   # VITE_API_URL=http://localhost:5000/api
pnpm install
pnpm dev               # http://localhost:5173
pnpm build             # production build in dist/
pnpm test              # unit tests (Vitest + React Testing Library)
pnpm test:watch        # unit tests, re-run on save
```

## Structure

```
src/
├── main.jsx                 # ThemeProvider + LocalizationProvider (dayjs, Monday weeks) + Router
├── App.jsx                  # Phone frame → ErrorBoundary → ServerGate → AuthProvider → <AppRoutes />
├── routes/
│   ├── index.jsx            # signed in? → <PrivateRoutes /> : <PublicRoutes />  (spinner while checking)
│   ├── PublicRoutes.jsx     # "/" Onboarding, "/signin", "/signup", anything else → /signin
│   └── PrivateRoutes.jsx    # TaskProvider + "/home", "/weeks", "/search", "/profile" + BottomNav
│                            #   + shared TaskSheet, TaskDetails, ConfirmDialog, Snackbar; anything else → /home
├── theme.js                 # Figma colors + Poppins font
├── api.js                   # fetch helper with "Authorization: Bearer <token>", auth, task and access-token calls, MCP_URL, 401 → sign out
├── context/
│   ├── AuthContext.jsx      # user, checking, signIn, signUp, signOut (token in localStorage)
│   └── TaskContext.jsx      # tasks, add/edit/remove/toggle, sheet, details, confirm(), notify()
├── utils/dateUtils.js       # startOfWeek (Monday), groupTasksByWeek, date/time formatting
├── pages/
│   ├── Onboarding.jsx       # Get Started → /signin
│   ├── SignIn.jsx           # email + password (test account filled in)
│   ├── SignUp.jsx           # name + email + password + confirm
│   ├── Home.jsx             # week strip, cards, progress, tasks of the day
│   ├── Weeks.jsx            # expandable week cards
│   ├── Search.jsx           # debounced server search
│   ├── Profile.jsx          # user info, edit icon, TEST ACCOUNT badge, task numbers, Sign out, Delete this account
│   └── SomethingWentWrong.jsx # crash page: Try again / Go to Home / details
└── components/
    ├── startup/
    │   ├── ServerGate.jsx   # GET /api/health → rows; OK → fade into the app; error → retry every 5 s
    │   ├── StartupScreen.jsx# gradient screen, glass card with live status rows, Try again
    │   └── SplashLogo.jsx   # animated logo (tick draws itself, pulse ring)
    ├── ErrorBoundary.jsx    # class component: catches crashes → SomethingWentWrong
    ├── EditProfileDrawer.jsx# edit name; email disabled
    ├── ConnectClaudeDrawer.jsx # Profile → Connect to Claude: make / list / revoke access tokens, MCP setup snippets
    ├── AuthLayout.jsx       # Sign In / Sign Up layout + AuthField (show/hide password)
    ├── BottomNav.jsx        # Home · Weeks · Search · Profile (tab follows the URL)
    ├── AddFab.jsx           # "+" button above the bottom nav
    ├── ScreenLayout.jsx     # fixed header + scrolling list (height = screen − bottom nav)
    ├── TaskItem.jsx         # row: checkbox, title, icons, swipe-to-delete, per-row spinner
    ├── TaskDetails.jsx      # read-only drawer with Edit / Delete / Mark Completed
    ├── TaskSheet.jsx        # add / edit form with checks
    ├── ConfirmDialog.jsx    # "Delete task?" / "Sign out?" (used through confirm())
    ├── PickerField.jsx      # Figma-style field that opens a picker dialog
    ├── pickers/             # TimeSheet (wheels), DateSheet (calendar), WheelColumn, QuickChips, DialogParts
    ├── WeekStrip.jsx, WeekCard.jsx, SummaryCards.jsx
    └── TaskSkeleton.jsx, icons.jsx, BackHeader.jsx, MobileFrame.jsx
```

## How the app starts

1. **ServerGate** calls `GET /api/health` and shows the **StartupScreen** (at least 1.4 s, so it does not flash). This happens **once per browser session**: after a successful check, `sessionStorage` gets `todo_server_checked = 1`, so reloads in the same tab skip it (a new tab or a new session checks again). All OK → "All systems ready" → fade out. Something down → the reason + "Try again" (auto every 5 s).
2. Then **AuthProvider** checks a saved sign-in, and the routes show (see below).
3. **ErrorBoundary** wraps everything: a crash in any screen shows **SomethingWentWrong** instead of a blank page.

## How access works

1. After the server check, `AuthContext` looks for a saved token. If there is one, it calls `GET /auth/me` (`checking = true`, a blank page for those few milliseconds). Only a `401` removes the token; a network error does not.
2. `routes/index.jsx` shows **PrivateRoutes** if there is a user, else **PublicRoutes**. Private pages are never mounted for a signed-out user.
3. Sign In / Sign Up save the token and set the user, so the private routes show at once.
4. Any `401` from the API (for example, an expired token) signs the user out.
5. Sign out (Profile, with confirm) removes the token. `TaskProvider` unmounts, so no tasks stay in memory.

## Shared actions

| From | Action | What it does |
|---|---|---|
| `useAuth()` | `signIn(email, password)`, `signUp(name, email, password)`, `signOut()` | Start / end the session |
| `useAuth()` | `updateProfile(name)`, `deleteAccount()` | Change the name; soft-delete the account and sign out |
| `useTasks()` | `addTask`, `editTask`, `removeTask`, `toggleStatus` | Call the API and update the shared list |
| `useTasks()` | `openSheet(task?, date?)`, `openDetails(task)` | Open the add/edit sheet or the details drawer |
| `useTasks()` | `await confirm({ title, message, confirmText })` | Confirm dialog, returns `true` / `false` |
| `useTasks()` | `notify(message)` | Red error message above the bottom nav |

## Unit tests

```
tests/
├── setup.js                 # jest-dom matchers + cleanup (page, localStorage, sessionStorage) after each test
├── renderWithProviders.jsx  # render with the MUI theme + MemoryRouter, like the real app
└── unit/                    # dateUtils, api, SignIn, SignUp, ServerGate, ErrorBoundary, WeekStrip, ConnectClaudeDrawer (45 tests)
```

- Tests run in **jsdom** (a fake browser), set in `vite.config.js` → `test`.
- `useAuth` and `api` are mocked with `vi.mock`, so the screens are tested alone.
- `ServerGate` uses **fake timers** (`vi.useFakeTimers`), so 5-second retries take no real time.
- Tests find elements the way a user does: by label (`getByLabelText('Email')`), role and text.

## Deploy (Netlify)

Base directory `client`, build `pnpm build`, publish `client/dist`, env `VITE_API_URL=<API URL>/api`.
`public/_redirects` sends every route to `index.html`.
