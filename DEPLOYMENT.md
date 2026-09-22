# Library Management — BTP deployment & auth

## Local development

```bash
npm ci
npm run watch          # CAP with mocked auth + SQLite (profile: local)
npm run ui:dev         # React UI on http://localhost:5173 (proxies /library)
```

Mock users (Basic auth): `admin` / `admin123`, `member` / `member123`.

## Build MTA

Prerequisites: [Cloud MTA Build Tool](https://www.npmjs.com/package/mbt), CF CLI, logged in to your BTP subaccount.

```bash
npm ci
mbt build
cf deploy mta_archives/Full_Stack_1.0.0.mtar
```

This deploys:

| Module | Purpose |
|--------|---------|
| `Full_Stack-srv` | CAP OData at `/library` |
| `Full_Stack-db-deployer` | HDI deploy to SAP HANA Cloud |
| `Full_Stack-app` | Approuter + React static UI |

Services: XSUAA (`Full_Stack-auth`), HANA HDI (`Full_Stack-db`).

Open the **approuter** URL (not the srv URL) in the browser — XSUAA login is handled there, and `/library` is proxied to the CAP service with the JWT.

## Assign roles (Role Collections)

1. BTP Cockpit → **Security** → **Role Collections** → **Create**.
2. Name e.g. `Library-Admin`, add application role **`Full_Stack-<org>-<space>.Admin`** (from your XSUAA instance).
3. Repeat for `Library-Member` → `.Member`.
4. **Security** → **Users** → select user → **Assign Role Collection** → pick one collection per test user.

Role template names in `xs-security.json` match CAP `@restrict` roles: `Admin`, `Member`.

## Production UI auth

Set `VITE_AUTH_MODE=xsuaa` when building the UI for MTA (default in `.env.production` if you add one). The approuter serves the SPA and uses session cookies; API calls use `credentials: 'include'`.
