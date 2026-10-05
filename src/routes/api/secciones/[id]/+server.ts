import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';
import { OBJETIVO_MAX, limpiarTexto } from '$lib/secciones';
import type { RequestHandler } from './$types';

// Actualiza el objetivo de una sección. Texto vacío lo borra (null).
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const body = await request.json().catch(() => null);
	if (!Number.isInteger(id) || typeof body?.objetivo !== 'string') {
		return json({ error: 'Petición inválida.' }, { status: 400 });
	}

	const objetivo = limpiarTexto(body.objetivo);
	if (objetivo.length > OBJETIVO_MAX) {
		return json({ error: `Hasta ${OBJETIVO_MAX} caracteres.` }, { status: 400 });
	}

	const seccion = db
		.update(secciones)
		.set({ objetivo: objetivo || null })
		.where(eq(secciones.id, id))
		.returning()
		.get();
	if (!seccion) return json({ error: 'Esa sección no existe.' }, { status: 404 });
	return json({ seccion });
};
