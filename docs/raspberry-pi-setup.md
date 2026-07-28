# Running Vend-a-Shu on a Raspberry Pi

## Requirements

- Raspberry Pi 4 or 5 (4 GB+ RAM recommended — on-server background removal is CPU-heavy, ~5–15 s per photo on a Pi)
- **Raspberry Pi OS 64-bit** (required: `onnxruntime-node` and `sharp` only ship prebuilt binaries for linux-arm64, not 32-bit)
- Pi connected to the same Wi-Fi network / router as the phones running the app

## 1. Install system software

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql

# pnpm
sudo corepack enable && corepack prepare pnpm@latest --activate
```

## 2. Create the database

```bash
sudo -u postgres psql -c "CREATE USER vas WITH PASSWORD 'choose-a-password';"
sudo -u postgres psql -c "CREATE DATABASE vendashu OWNER vas;"
```

## 3. Get the code onto the Pi

Either `git clone` your repo, or download the project zip from Replit and copy it over (`scp`). Then:

```bash
cd vend-a-shu   # project root
pnpm install
```

Verify no native-module build errors in the install output (sharp and onnxruntime-node should download arm64 prebuilds).

## 4. Configure environment

Create `/home/pi/vend-a-shu/.env` values (or export in the service file below):

```
DATABASE_URL=postgres://vas:choose-a-password@localhost:5432/vendashu
SESSION_SECRET=<generate: openssl rand -hex 32>
NODE_ENV=production
PORT=3001
```

## 5. Create the schema

```bash
cd lib/db
DATABASE_URL=postgres://vas:...@localhost:5432/vendashu pnpm drizzle-kit push
```

## 6. Build and run the API server

```bash
pnpm --filter @workspace/api-server run build
PORT=3001 DATABASE_URL=... SESSION_SECRET=... NODE_ENV=production \
  node artifacts/api-server/dist/index.mjs
```

Smoke test from another machine on the network:

```bash
curl http://<pi-ip>:3001/api/health   # or any known endpoint, e.g. /api/users
curl http://<pi-ip>:3001/api/photos/backgrounds
```

## 7. Run it as a service (auto-start on boot)

`/etc/systemd/system/vendashu.service`:

```ini
[Unit]
Description=Vend-a-Shu API
After=network.target postgresql.service

[Service]
User=pi
WorkingDirectory=/home/pi/vend-a-shu
EnvironmentFile=/home/pi/vend-a-shu/.env
ExecStart=/usr/bin/node artifacts/api-server/dist/index.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now vendashu
journalctl -u vendashu -f   # watch logs
```

## 8. Point the mobile app at the Pi

On the app's Connect screen, enter the Pi's IP address (find it with `hostname -I` on the Pi, or your router's device list) and port `3001`. Phones must be on the same Wi-Fi network.

Optional: give the Pi a static IP (router DHCP reservation) so the address never changes.

## 9. First photo — expect a one-time delay

The first background-removal request downloads/loads the ONNX model, so it is slower than subsequent ones. After that, expect roughly 5–15 seconds per photo on Pi hardware.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `sharp`/`onnxruntime` install errors | You're on 32-bit OS — reflash with Raspberry Pi OS 64-bit |
| App can't connect | Same Wi-Fi? Correct IP/port? `curl` from a laptop to isolate phone vs. server |
| `DATABASE_URL must be set` | The env file isn't being loaded — check `EnvironmentFile=` path |
| Photo processing very slow / OOM | Use a Pi with 4 GB+; close other services |
