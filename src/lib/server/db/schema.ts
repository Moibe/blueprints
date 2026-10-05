import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Secciones del sidebar: cada una es una "hoja" del plano (A-01, A-02…) y se crea con + Crear.
// Tras cambiar el schema: `npm run db:generate` (migración en ./drizzle) y `npm run db:migrate`.
export const secciones = sqliteTable('secciones', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nombre: text('nombre').notNull(),
	// Se edita en el cuadro de rotulación de la hoja (clic en "Objetivo"). Null = sin objetivo.
	objetivo: text('objetivo'),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Seccion = typeof secciones.$inferSelect;

// Tarjetas del área de dibujo de cada sección; `hecho` = palomeada como completada.
export const tarjetas = sqliteTable('tarjetas', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	seccionId: integer('seccion_id')
		.notNull()
		.references(() => secciones.id, { onDelete: 'cascade' }),
	texto: text('texto').notNull(),
	hecho: integer('hecho', { mode: 'boolean' }).notNull().default(false),
	// Cuándo se palomeó; null mientras está pendiente.
	logrado: integer('logrado', { mode: 'timestamp' }),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Tarjeta = typeof tarjetas.$inferSelect;
