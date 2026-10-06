#!/usr/bin/env bash
# Actualiza blueprints en el droplet. Se corre desde cualquier carpeta:
#   ~/apps/blueprints/scripts/deploy.sh
#
# git pull → npm ci → build (en build.next) → migraciones → swap de carpeta → pm2 reload →
# comprobación de que responde. Con set -e, si algo falla se detiene ahí: el build se hace en
# build.next y las migraciones van ANTES de tocar build/ y de reiniciar, así que un build o
# una migración rotos dejan la app anterior corriendo intacta.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
	echo "Falta .env en $(pwd). Copia .env.example y llénalo (ver README › Despliegue)." >&2
	exit 1
fi

echo "▸ git pull"
git pull --ff-only

echo "▸ npm ci"
# --include=dev: vite/svelte-kit/adapter-node son devDependencies y hacen falta para el build;
# npm las omitiría si el shell tuviera NODE_ENV=production.
npm ci --include=dev --no-audit --no-fund

echo "▸ build (en build.next; build/ sigue sirviendo mientras tanto)"
rm -rf build.next
BUILD_OUT=build.next npm run build

echo "▸ migraciones"
npm run db:migrate

echo "▸ swap build.next → build"
rm -rf build.prev
if [ -d build ]; then mv build build.prev; fi
mv build.next build

echo "▸ pm2"
# Por archivo (no `pm2 reload blueprints`): así se re-lee .env y se aplican sus cambios.
pm2 startOrReload ecosystem.config.cjs --update-env

# adapter-node valida ORIGIN/BODY_SIZE_LIMIT al cargar y `listen` puede fallar (puerto ocupado o
# privilegiado): pm2 devuelve 0 igual, así que se comprueba que la app de verdad responda.
PUERTO=$(grep -E '^PORT=' .env | tail -1 | cut -d= -f2- | tr -d ' "'"'"'\r')
sleep 2
if ! curl -fsS -o /dev/null "http://127.0.0.1:${PUERTO:-3000}/login"; then
	echo "✗ la app no responde en 127.0.0.1:${PUERTO:-3000} tras el reload. Últimos logs:" >&2
	pm2 logs blueprints --lines 40 --nostream >&2 || true
	echo "Para volver a la versión anterior: rm -rf build && mv build.prev build && pm2 restart blueprints" >&2
	exit 1
fi
pm2 save

echo "✓ listo: $(git log -1 --format='%h %s')"
