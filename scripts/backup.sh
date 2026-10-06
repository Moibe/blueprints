#!/usr/bin/env bash
# Respaldo diario de la base de blueprints. Usa el better-sqlite3 del proyecto (API de
# backup en línea: consistente aunque la app esté corriendo), sin instalar nada con apt.
# Instalación y cron: README › Operación.
set -euo pipefail
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
exec node --input-type=module - <<'JS'
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const proyecto = path.join(os.homedir(), 'code/blueprints');
const Database = createRequire(path.join(proyecto, 'package.json'))('better-sqlite3');
const destino = path.join(os.homedir(), 'respaldos');
fs.mkdirSync(destino, { recursive: true });

const archivo = path.join(destino, `blueprints-${new Date().toISOString().slice(0, 10)}.db`);
const db = new Database(path.join(proyecto, 'local.db'), { fileMustExist: true });
await db.backup(archivo);
db.close();

// Se verifica el respaldo ya escrito, no la base original.
const copia = new Database(archivo, { fileMustExist: true });
const estado = copia.pragma('integrity_check', { simple: true });
copia.close();
if (estado !== 'ok') {
	console.error(`${new Date().toISOString()} RESPALDO CORRUPTO (${estado}): ${archivo}`);
	process.exit(1);
}

// Conserva 30 días.
for (const f of fs.readdirSync(destino)) {
	const ruta = path.join(destino, f);
	if (/^blueprints-.*\.db$/.test(f) && Date.now() - fs.statSync(ruta).mtimeMs > 30 * 864e5) fs.unlinkSync(ruta);
}
console.log(`${new Date().toISOString()} respaldo ok: ${archivo} (${fs.statSync(archivo).size} bytes, integridad ${estado})`);
JS
