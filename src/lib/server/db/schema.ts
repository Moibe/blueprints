import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Secciones del sidebar: cada una es una "hoja" del plano (A-01, A-02…) y se crea con + Crear.
// Tras cambiar el schema: `npm run db:generate` (migración en ./drizzle) y `npm run db:migrate`.
export const secciones = sqliteTable('secciones', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nombre: text('nombre').notNull(),
	creado: integer('creado', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Seccion = typeof secciones.$inferSelect;
