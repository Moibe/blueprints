import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Jerarquía: una sección (proyecto) tiene varios objetivos; un objetivo, varias tareas.
// Tras cambiar el schema: `npm run db:generate` (migración en ./drizzle) y `npm run db:migrate`.
export const secciones = sqliteTable('secciones', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nombre: text('nombre').notNull(),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Seccion = typeof secciones.$inferSelect;

// Objetivos de una sección; en la hoja son una pila sobre el área de dibujo (se ve uno a la vez).
export const objetivos = sqliteTable('objetivos', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	seccionId: integer('seccion_id')
		.notNull()
		.references(() => secciones.id, { onDelete: 'cascade' }),
	nombre: text('nombre').notNull(),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Objetivo = typeof objetivos.$inferSelect;

// Tareas (las tarjetas del área de dibujo) de un objetivo; `hecho` = palomeada como completada.
export const tarjetas = sqliteTable('tarjetas', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	objetivoId: integer('objetivo_id')
		.notNull()
		.references(() => objetivos.id, { onDelete: 'cascade' }),
	texto: text('texto').notNull(),
	hecho: integer('hecho', { mode: 'boolean' }).notNull().default(false),
	// Cuándo se palomeó; null mientras está pendiente.
	logrado: integer('logrado', { mode: 'timestamp' }),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Tarjeta = typeof tarjetas.$inferSelect;
