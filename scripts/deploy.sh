#!/usr/bin/env bash
# Actualiza blueprints en el droplet. Se corre desde cualquier carpeta:
#   ~/apps/blueprints/scripts/deploy.sh
#
# git pull → npm ci → build → migraciones → pm2 reload. Con set -e, si algo falla se detiene
# ahí: el build y las migraciones van ANTES de reiniciar, así que un build roto deja la app
# anterior corriendo (aunque sin sus assets estáticos mientras dura el build).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
	echo "Falta .env en $(pwd). Copia .env.example y llénalo (ver README › Despliegue)." >&2
	exit 1
fi

echo "▸ git pull"
git pull --ff-only

echo "▸ npm ci"
npm ci --no-audit --no-fund

echo "▸ build"
npm run build

echo "▸ migraciones"
npm run db:migrate

echo "▸ pm2"
pm2 startOrReload ecosystem.config.cjs
pm2 save

echo "✓ listo: $(git log -1 --format='%h %s')"
