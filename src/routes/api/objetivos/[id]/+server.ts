import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { objetivos } from '$lib/server/db/schema';
import { OBJETIVO_MAX, limpiarTexto } from '$lib/secciones';
import type { RequestHandler } from './$types';

// Renombra un objetivo.
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const body = await request.json().catch(() => null);
	const nombre = typeof body?.nombre === 'string' ? limpiarTexto(body.nombre) : '';

	if (!Number.isInteger(id) || !nombre) {
		return json({ error: 'El nombre no puede quedar vacío.' }, { status: 400 });
	}
	if (nombre.length > OBJETIVO_MAX) {
		return json({ error: `Hasta ${OBJETIVO_MAX} caracteres.` }, { status: 400 });
	}
	const objetivo = db
		.update(objetivos)
		.set({ nombre })
		.where(eq(objetivos.id, id))
		.returning({ id: objetivos.id, nombre: objetivos.nombre })
		.get();
	if (!objetivo) return json({ error: 'Ese objetivo no existe.' }, { status: 404 });
	return json({ objetivo });
};

// Borra un objetivo con todas sus tareas (cascade).
export const DELETE: RequestHandler = ({ params }) => {
	const id = Number(params.id);
	const borrado = Number.isInteger(id) && db.delete(objetivos).where(eq(objetivos.id, id)).run().changes > 0;
	if (!borrado) return json({ error: 'Ese objetivo no existe.' }, { status: 404 });
	return json({ ok: true });
};
