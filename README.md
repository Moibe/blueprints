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
npm run dev                 # http://localhost:8888
```

Comandos útiles: `npm run check` (svelte-check), `npm run db:generate` (nueva migración tras
tocar `src/lib/server/db/schema.ts`), `npm run build && npm start` (prueba el build de
producción tal cual correrá en el droplet, con el `.env` local).

## Despliegue en el droplet · https://blueprints.moibe.me

Arquitectura: `node build` (adapter-node) escucha en `127.0.0.1:8888` bajo **pm2**;
**nginx** hace el proxy reverso con TLS de **certbot**. Archivos involucrados:

| Archivo | Para qué |
| --- | --- |
| `ecosystem.config.cjs` | Proceso pm2: lee `.env` y arranca `build/index.js` |
| `deploy/nginx/blueprints.moibe.me.conf` | Server block de nginx (certbot le agrega el 443) |
| `scripts/deploy.sh` | Actualizar: pull → ci → build → migraciones → swap → reload → comprobar |
| `scripts/migrate.mjs` | Migraciones con respaldo previo de la base |
| `.env` (no se commitea) | Variables; ver bloque de abajo |

Los pasos están escritos para un usuario normal con `sudo` (no root). Si operas como root,
sáltate los `sudo`.

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

- **Firewall.** Si `sudo ufw status` dice `active`, abre web: `sudo ufw allow 'Nginx Full'`
  (80 y 443). Si el droplet tiene un Cloud Firewall de DigitalOcean, abre 80/443 TCP ahí
  también; si no, certbot falla con "Timeout during connect".
- **Memoria.** El build de Vite usa ~1 GB. Si el droplet tiene ≤ 2 GB de RAM y no tiene swap,
  créalo una vez o el build (y a veces la app) muere por falta de memoria:
  ```sh
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

**2. Código y `.env`.**

```sh
mkdir -p ~/code
git clone https://github.com/Moibe/blueprints.git ~/code/blueprints
cd ~/code/blueprints
cp .env.example .env && nano .env
```

`.env` del droplet (todo lo demás como en `.env.example`):

```ini
PORT=8888
HOST=127.0.0.1
ORIGIN=https://blueprints.moibe.me
DATABASE_URL=./local.db
ADMIN_PASSWORD="una-contraseña-larga"
ADDRESS_HEADER=x-forwarded-for
XFF_DEPTH=1
```

- `ORIGIN` exacto (https, sin `/` final): SvelteKit rechaza los POST cuyo `Origin` no coincida
  y la cookie de sesión solo sale `secure` si la URL es https.
- `ADMIN_PASSWORD` es obligatoria: en producción, sin ella la app niega todo. **Siempre entre
  comillas dobles**: `node --env-file` corta el valor en el primer `#` fuera de comillas (y
  recorta espacios), así que una contraseña con `#` quedaría truncada sin aviso.
- `ADDRESS_HEADER`/`XFF_DEPTH`: IP real del visitante para el freno de intentos de login.

**3. Build, migraciones y pm2.**

```sh
npm ci --include=dev
npm run build
npm run db:migrate                 # crea ~/code/blueprints/local.db
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup                        # imprime un comando sudo: córrelo para que arranque con el sistema
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:8888/
# → 303 http://127.0.0.1:8888/login   (si no: pm2 logs blueprints)
```

**4. nginx + certificado.**

```sh
sudo cp deploy/nginx/blueprints.moibe.me.conf /etc/nginx/sites-available/blueprints.moibe.me
sudo ln -s /etc/nginx/sites-available/blueprints.moibe.me /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d blueprints.moibe.me --redirect --hsts
```

Listo: `https://blueprints.moibe.me` pide la contraseña. certbot deja programada la renovación
y recarga nginx solo (`sudo certbot renew --dry-run` para comprobarlo).

### Actualizar

```sh
~/code/blueprints/scripts/deploy.sh
```

Hace `git pull --ff-only`, `npm ci`, construye en `build.next`, aplica migraciones (con
respaldo previo de la base), cambia `build.next` → `build` de un golpe, `pm2 startOrReload` y
comprueba que la app responda. Si el build o una migración fallan se detiene ahí y la versión
anterior sigue corriendo intacta; si la app nueva no levanta, lo dice, muestra los logs y deja
la anterior en `build.prev` (el comando para volver sale en pantalla).

`ecosystem.config.cjs` lee `.env` cada vez que pm2 lo evalúa, así que para aplicar un cambio
de `.env` (p. ej. `ADMIN_PASSWORD`, que además cierra las sesiones abiertas) el comando es
`pm2 startOrReload ecosystem.config.cjs`; un `pm2 reload blueprints` a secas reutiliza el
entorno guardado y **no** lo aplica. Lo que diga `.env` gana sobre cualquier variable
exportada en el shell.

### Actualizar Node

Con nvm, `pm2` y el servicio de `pm2 startup` quedan atados a la carpeta de la versión de Node
instalada: si cambias de versión sin rehacerlos, pm2 desaparece del PATH y la app no arranca
al reiniciar el droplet.

```sh
nvm install 24 && nvm alias default 24   # o la versión que toque (engines exige >= 22.12)
npm install -g pm2 && pm2 update
pm2 unstartup systemd                    # corre la línea sudo que imprime
pm2 startup systemd                      # ídem
~/code/blueprints/scripts/deploy.sh      # npm ci + build + reload con el Node nuevo
pm2 save
```

(Con Node de NodeSource/apt no pasa: node y pm2 viven en `/usr/bin`.)

### Operación

- Logs: `pm2 logs blueprints` · estado: `pm2 status` · reiniciar: `pm2 restart blueprints`.
- La base es `~/code/blueprints/local.db` (está en `.gitignore`: `git pull` nunca la toca).
  Cada `db:migrate` deja un respaldo `local.db.pre-migrate-<fecha>` (se guardan los 5 últimos).
- Respaldo diario fuera de la carpeta del proyecto (`sudo apt install sqlite3`; `.backup` es
  consistente aunque la app esté corriendo, `cp` no lo es con WAL). En `crontab -e`:
  ```
  15 3 * * * mkdir -p $HOME/respaldos && sqlite3 $HOME/code/blueprints/local.db ".backup '$HOME/respaldos/blueprints-$(date +\%F).db'" && find $HOME/respaldos -name 'blueprints-*.db' -mtime +30 -delete
  ```
  Y de vez en cuando cópialos fuera del droplet (`scp`/`rsync`): es la única copia de tus datos.
- Si pierdes la contraseña: cambia `ADMIN_PASSWORD` en `.env` y `pm2 startOrReload ecosystem.config.cjs`.
- Tras 5 contraseñas malas desde una IP, el login responde 429 por 10 minutos (se reinicia
  con `pm2 restart blueprints`).
