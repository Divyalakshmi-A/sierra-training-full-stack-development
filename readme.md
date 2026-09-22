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

## Local run

Requires **Node.js 22** (CAP 10). With [nvm-windows](https://github.com/coreybutler/nvm-windows):

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
