# Library Management System (CAP + React)

## Project layout

| Path | Purpose |
|------|---------|
| `db/` | CDS domain model and CSV seed data |
| `srv/` | OData service (`/library`), handlers, `@restrict` roles |
| `app/library-ui/` | Vite + React + UI5 Web Components frontend |
| `app/router/` | SAP Approuter for BTP (static UI + XSUAA + `/library` proxy) |
| `xs-security.json` | XSUAA scopes and role templates |
| `mta.yaml` | MTA deploy (srv, HDI, approuter, XSUAA, HANA) |
| `DEPLOYMENT.md` | BTP deploy steps and role collection assignment |

## Local run (incl. SAP Business Application Studio)

**One-time setup** (project root, not `app/`):

```bash
npm run setup
npx cds deploy --to sqlite --profile local
```

**Two terminals — project root** (`Full_Stack` / repo root):

| Terminal | Command |
|----------|---------|
| Backend | `cds watch --profile local` or `npm run watch` |
| Frontend | `npm run dev` or `npm run ui:dev` |

If your terminal is already in **`app/`**, use `npm run dev` (runs `library-ui`).

Or run the UI from **`app/library-ui/`**: `npm run dev`.

Open the **frontend** preview URL (port **5173**). API is on **4004**; Vite proxies `/library`.

Requires **Node.js 22** (CAP 10). On Windows with [nvm-windows](https://github.com/coreybutler/nvm-windows):

```powershell
nvm use 22.14.0
npm ci
npx cds deploy --to sqlite --profile local
```

Terminal 1 — API:

```powershell
nvm use 22.14.0
npm run watch
```

Terminal 2 — UI:

```powershell
nvm use 22.14.0
npm run ui:dev
```

Or use `.\scripts\dev-api.ps1` and `.\scripts\dev-ui.ps1` (they prepend Node 22 to PATH).

Open http://localhost:5173 and sign in with `admin` / `admin123` or `member` / `member123`.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Cloud Foundry / XSUAA deployment.
