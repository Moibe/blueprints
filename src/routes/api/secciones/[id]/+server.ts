import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';
import { NOMBRE_MAX, limpiarTexto } from '$lib/secciones';
import { nombreRepetido } from '$lib/server/secciones';
import type { RequestHandler } from './$types';

// Renombra una sección. No puede quedar vacía ni repetir el nombre de otra.
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const body = await request.json().catch(() => null);
	const nombre = typeof body?.nombre === 'string' ? limpiarTexto(body.nombre) : '';

	if (!Number.isInteger(id) || !nombre) {
		return json({ error: 'El nombre no puede quedar vacío.' }, { status: 400 });
	}
	if (nombre.length > NOMBRE_MAX) {
		return json({ error: `El nombre puede tener hasta ${NOMBRE_MAX} caracteres.` }, { status: 400 });
	}
	if (nombreRepetido(nombre, id)) {
		return json({ error: 'Ya hay un proyecto con ese nombre.' }, { status: 409 });
	}

	const seccion = db.update(secciones).set({ nombre }).where(eq(secciones.id, id)).returning().get();
	if (!seccion) return json({ error: 'Ese proyecto no existe.' }, { status: 404 });
	return json({ seccion });
};
