# blueprints

Planes personales con look de cianotipo: secciones → objetivos → tarjetas. SvelteKit 2 +
Svelte 5 (runes), Tailwind 4, SQLite (better-sqlite3 + drizzle), `adapter-node`.
Un solo usuario: entra con la contraseña de `ADMIN_PASSWORD`.

## Desarrollo local

Node 22 LTS (`.nvmrc`; `.npmrc` tiene `engine-strict`, así que npm se niega con uno viejo).

```sh
npm install
cp .env.example .env        # con ADMIN_PASSWORD vacío la app queda abierta en dev
npm run db:migrate          # crea ./local.db
npm run dev                 # http://localhost:1000
```

Comandos útiles: `npm run check` (svelte-check), `npm run db:generate` (nueva migración tras
tocar `src/lib/server/db/schema.ts`), `npm run build && npm start` (prueba el build de
producción tal cual correrá en el droplet, con el `.env` local).

## Despliegue en el droplet · https://blueprints.moibe.me

Arquitectura: `node build` (adapter-node) escucha en `127.0.0.1:1000` bajo **pm2**;
**nginx** hace el proxy reverso con TLS de **certbot**. Archivos involucrados:

| Archivo | Para qué |
| --- | --- |
| `ecosystem.config.cjs` | Proceso pm2: `node --env-file=.env build/index.js` |
| `deploy/nginx/blueprints.moibe.me.conf` | Server block de nginx (certbot le agrega el 443) |
| `scripts/deploy.sh` | Actualizar: pull → ci → build → migraciones → reload |
| `.env` (no se commitea) | Variables; ver bloque de abajo |

### Primera vez

**0. DNS.** Registro `A` de `blueprints.moibe.me` → IP del droplet (antes de certbot).

**1. Herramientas** (si el droplet aún no las tiene): Node 22 LTS, pm2, nginx, certbot.

```sh
# Node 22 con nvm (o NodeSource); luego:
npm install -g pm2
sudo apt install -y nginx certbot python3-certbot-nginx
# Solo si `npm ci` tuviera que compilar better-sqlite3 (normalmente baja un binario):
sudo apt install -y build-essential python3
```

**2. Código y `.env`.**

```sh
git clone https://github.com/Moibe/blueprints.git ~/apps/blueprints
cd ~/apps/blueprints
cp .env.example .env && nano .env
```

`.env` del droplet (todo lo demás como en `.env.example`):

```ini
PORT=1000
HOST=127.0.0.1
ORIGIN=https://blueprints.moibe.me
DATABASE_URL=./local.db
ADMIN_PASSWORD=una-contraseña-larga
ADDRESS_HEADER=x-forwarded-for
XFF_DEPTH=1
```

- `ORIGIN` exacto (https, sin `/` final): SvelteKit rechaza los POST cuyo `Origin` no coincida
  y la cookie de sesión solo sale `secure` si la URL es https.
- `ADMIN_PASSWORD` es obligatoria: en producción, sin ella la app niega todo.
- `ADDRESS_HEADER`/`XFF_DEPTH`: IP real del visitante para el freno de intentos de login.

**3. Build, migraciones y pm2.**

```sh
npm ci
npm run build
npm run db:migrate                 # crea ~/apps/blueprints/local.db
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup                        # imprime un comando sudo: córrelo para que arranque con el sistema
curl -I http://127.0.0.1:1000/     # 303 → /login
```

**4. nginx + certificado.**

```sh
sudo cp deploy/nginx/blueprints.moibe.me.conf /etc/nginx/sites-available/blueprints.moibe.me
sudo ln -s /etc/nginx/sites-available/blueprints.moibe.me /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d blueprints.moibe.me --redirect
```

Listo: `https://blueprints.moibe.me` pide la contraseña. certbot deja programada la renovación
(`sudo certbot renew --dry-run` para comprobarlo).

### Actualizar

```sh
~/apps/blueprints/scripts/deploy.sh
```

Hace `git pull --ff-only`, `npm ci`, `npm run build`, `npm run db:migrate` y
`pm2 startOrReload`. Si el build o una migración fallan se detiene ahí y la versión anterior
sigue corriendo. Las variables se leen de `.env` en cada arranque, así que cambiar
`ADMIN_PASSWORD` solo necesita `pm2 reload blueprints` (y cierra las sesiones abiertas).

### Operación

- Logs: `pm2 logs blueprints` · estado: `pm2 status` · reiniciar: `pm2 restart blueprints`.
- La base es `~/apps/blueprints/local.db` (está en `.gitignore`: `git pull` nunca la toca).
  Respaldo consistente aunque la app esté corriendo:
  `sqlite3 local.db ".backup '/ruta/respaldo-$(date +%F).db'"` (`sudo apt install sqlite3`).
- Si pierdes la contraseña: cambia `ADMIN_PASSWORD` en `.env` y `pm2 reload blueprints`.
- Tras 5 contraseñas malas desde una IP, el login responde 429 por 10 minutos (se reinicia
  con `pm2 restart blueprints`).
