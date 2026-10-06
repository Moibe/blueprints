import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const url = process.env.DATABASE_URL ?? './local.db';
// Se mira ANTES de abrir: `new Database` crea el archivo, y en la primera migración
// respaldaría una base recién creada y vacía.
const habiaDatos = fs.existsSync(url) && fs.statSync(url).size > 0;
const sqlite = new Database(url);

// Respaldo previo (API de backup en línea: consistente aunque la app esté corriendo en WAL).
// El ROLLBACK del migrador solo cubre errores SQL, no una migración válida que borre datos.
// Se conservan los 5 más recientes; .gitignore los tapa con `local.db*`.
if (habiaDatos) {
	const marca = new Date().toISOString().replace(/[:.]/g, '-');
	const respaldo = `${url}.pre-migrate-${marca}`;
	await sqlite.backup(respaldo);
	console.log(`Respaldo previo: ${respaldo}`);
	const dir = path.dirname(url);
	const prefijo = `${path.basename(url)}.pre-migrate-`;
	fs.readdirSync(dir)
		.filter((f) => f.startsWith(prefijo))
		.sort()
		.slice(0, -5)
		.forEach((f) => fs.unlinkSync(path.join(dir, f)));
}

// El migrador corre todo dentro de una transacción y ahí `PRAGMA foreign_keys=OFF` (el que
// drizzle-kit pone en las migraciones que recrean tablas) es no-op. Con las FK activas, el
// DROP de una tabla padre dispararía los ON DELETE CASCADE y vaciaría las hijas sin error.
// La app vuelve a activarlas al arrancar (src/lib/server/db/index.ts).
sqlite.pragma('foreign_keys = OFF');
migrate(drizzle(sqlite), { migrationsFolder: './drizzle' });

const violaciones = sqlite.pragma('foreign_key_check');
if (violaciones.length) {
	console.error('foreign_key_check falló tras migrar:', violaciones);
	sqlite.close();
	process.exit(1);
}

sqlite.close();
console.log(`Migrations applied to ${url}`);
