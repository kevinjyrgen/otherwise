# Usaldusabiline (Trusted Helper) — Team OtherWise, Wise Hackathon 2026

Family member prepares a payment, the owner approves it with one big Yes / No.
**Read [CONTRACT.md](CONTRACT.md) first** — data model, API, socket events and who edits which folder.

```
shared/   types.ts — the contract, imported by both sides
server/   Express + Socket.IO API (port 3001)
web/      Vite + React + React Router (port 5173)
  src/owner/    developer 1
  src/helper/   developer 2
  src/lib/      api.ts, socket.ts (developer 3)
```

Requires Node 20+ (20.11 or newer).

## Run (dev)

```bash
npm install
npm run dev
```

- Web: http://localhost:5173 → `/owner` (Valentina) or `/helper` (Mari Tamm)
- Vite proxies `/api`, `/uploads` and `/socket.io` to the server on :3001, so the browser only talks to one origin.
- Server data is in memory. Restarting the server or calling `curl -X POST localhost:3001/api/dev/reset` starts it fresh.

Quick API check:

```bash
curl -s localhost:3001/api/me -H 'x-user-id: u_owner'
```

## Run (production, single origin)

```bash
npm run build      # type-checks and builds web/dist
npm start          # server on :3001 serves the API, socket and the built app
```

Open http://localhost:3001/owner. Use `PORT=8080 npm start` to change the port.

## Phones over HTTPS (tunnel)

Phones need HTTPS for the camera, mic and speech. Expose the **dev** server with a tunnel. Vite already allows any host, and the proxy makes `/api` and the socket work through it.

**Cloudflare quick tunnel** (no account needed):

```bash
brew install cloudflared
npm run dev                                   # terminal 1
cloudflared tunnel --url http://localhost:5173  # terminal 2 → prints https://xxxx.trycloudflare.com
```

**ngrok** (free account):

```bash
ngrok http 5173
```

Open `https://<tunnel>/owner` on one phone and `https://<tunnel>/helper` on the other.
For the production build, tunnel port 3001 instead.

Same Wi-Fi without HTTPS works for basic testing with the `Network` URL Vite prints, but the camera and speech APIs may be blocked.

## Scripts

| | |
|---|---|
| `npm run dev` | server (tsx watch) + web (vite) together |
| `npm run build` | build web into `web/dist` |
| `npm start` | production server, serves `web/dist` |
| `npm run typecheck` | tsc for server and web |
| `npm run lint` | oxlint on web |

## Team rules

- Stay in your folder (see CONTRACT.md).
- Contract changes go through developer 3 and are announced to the team.
- Commit before larger AI changes. Pull before you start.
