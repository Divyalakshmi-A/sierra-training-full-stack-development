# Deploy to SAP BTP (Trial) + auth + BAS disk space

## Auth: local vs cloud (already configured)

| Environment | How it works |
|-------------|----------------|
| **Local / BAS dev** | `cds watch --profile local` → **mocked** users in `package.json` `[local]` (`admin` / `member`, Basic auth). Database: **SQLite**. |
| **Cloud (CF)** | MTA binds **real XSUAA** + **HANA HDI**. CAP uses `kind: xsuaa` from `[production]` (in `gen/srv` after build). UI built with `VITE_AUTH_MODE=xsuaa` (see `app/library-ui/.env.production`). Login via **approuter**, not mocked users. |

You do **not** deploy mocked auth to BTP; mocked auth stays local only.

---

## Before first deploy (Trial subaccount)

1. **Entitlements** (BTP Cockpit → Entitlements → Configure Entitlements): enable **Cloud Foundry** (if needed), **SAP HANA Cloud** (e.g. `hdi-shared`), **XSUAA** (`application` plan), enough **memory** for 2–3 apps.
2. **HANA Cloud** (only once): create a **HANA Cloud** instance in your subaccount and map it to your **dev space** (SAP HANA Cloud Central → instance → … → assign to space). Without this, HDI deploy fails.
3. **CF login** in BAS terminal:

```bash
cf login -a https://api.cf.<region>.hana.ondemand.com
cf target -o <your-org> -s dev
```

Use your trial region URL from the cockpit (e.g. `eu10`, `us10`).

---

## Build and deploy (from project root)

The MTA is sized for a **3 GB BAS** disk:

- UI and CAP `node_modules` are used **only to build**, then deleted
- `mbt` packages **source + built UI**, not `node_modules`
- Cloud Foundry **installs npm packages during deploy** (plenty of disk on CF)

**Do not** run `cds watch` and `mbt build` in the same space at the same time.

```bash
# 1) free leftover install/build folders
npm run clean
npm cache clean --force
df -h $HOME

# 2) build small .mtar (prepare + mbt)
npm run mta:build

# 3) deploy (npm install happens on BTP)
cf deploy mta_archives/Full_Stack_1.0.0.mtar
```

If `mbt` is not installed: `npm i -g mbt` uses extra disk — prefer the BAS **MTA Tools** extension / `mbt` already on PATH.

First-time BAS after clone: you only need Node 22. **Do not** `npm run setup` before deploy — that installs local `node_modules` you do not need for `mta:build`.

What gets deployed:

| Module | Purpose |
|--------|---------|
| `Full_Stack-srv` | CAP OData `/library` (xsuaa + hana) |
| `Full_Stack-db-deployer` | HDI schema + CSV data to HANA |
| `Full_Stack-app` | Approuter + React build in `resources/` |

After deploy:

```bash
cf apps
```

Open the URL of **`Full_Stack-app`** (approuter), **not** `Full_Stack-srv`.

The React UI is **not** a separate MTA module. `mta.yaml` module `Full_Stack-app` with `path: app/router` is correct: that is the SAP Approuter, and the Vite build is copied into `app/router/resources/` during `node scripts/prepare-mta.js` (MTA `before-all`).

If you see a **white screen** and `index.html` still has `<script src="/src/main.jsx">`, the **source** HTML was deployed instead of the Vite `dist`. Rebuild with `npm run mta:build` after pulling these fixes (`resources/` must not be gitignored, or `mbt` omits the JS).

---

## XSUAA roles on Trial

1. After deploy, Cockpit → **Security** → **Role Collections**. You should see **Library-Admin** and **Library-Member** (from `xs-security.json`). If not, create them and add application roles `….Admin` / `….Member`.
2. **Security** → **Users** → your trial user → **Assign Role Collection** (`Library-Admin` to manage data, `Library-Member` for read-only).
3. Open the **approuter** URL again. Use **Log out** if you were already signed in so the token picks up the new roles.

On BTP there is **no** `admin`/`member` password form. SAP XSUAA is the login. The React login screen is **local only** (`cds watch --profile local`).

---

## If deploy fails (common on Trial)

| Symptom | What to check |
|---------|----------------|
| HDI / database errors | HANA Cloud instance created and mapped to space; `hdi-shared` entitled |
| Routes / OAuth redirect | Open app via **approuter** URL; redirect URIs in `mta.yaml` / `xs-security.json` |
| 403 on API | User has role collection; wait 1–2 min after assignment |
| Out of memory | Trial quota; `cf apps` / scale down other apps or reduce instances |

Logs:

```bash
cf logs Full_Stack-srv --recent
cf logs Full_Stack-app --recent
```

---

## Free space in BAS (~3 GB limit)

Build artifacts and **multiple `node_modules`** folders use most space.

**Safe cleanup** (project root):

```bash
npm run clean
```

This removes `gen/`, `target/`, `mta_archives/`, all `node_modules/`, SQLite, MTA temp dirs. Your **source code stays**.

**After clean**, local dev again:

```bash
npm run setup
npx cds deploy --to sqlite --profile local
```

**Habits to save space**

- Run `npm run clean` after a successful `cf deploy` (keep the `.mtar` elsewhere only if you need it).
- Do **not** commit `node_modules`, `gen/`, `mta_archives/`, `*.sqlite` (already in `.gitignore`).
- Prefer **`npm ci`** over repeated `npm install` (fewer cache duplicates).
- In BAS: **File → Show Disk Space**; delete old unused dev spaces/projects if the whole dev space is full.
- Build MTA only when deploying, not on every code change; use `cds watch` + `npm run dev` for daily work.

**Typical sizes (order of magnitude)**

- Root + UI + router `node_modules`: ~500 MB–1.5 GB  
- `gen/` + `mbt build` temp: ~100–400 MB  
- `mta_archives/*.mtar`: ~50–150 MB  

Running `clean` + `setup` when needed usually recovers **1–2 GB**.

---

## Local dev (unchanged)

```bash
npm run watch          # mocked auth + SQLite
npm run dev            # UI on :5173
```

Mock users: `admin` / `admin123`, `member` / `member123`.
