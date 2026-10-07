import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { objetivos, secciones } from '$lib/server/db/schema';
import { OBJETIVO_MAX, limpiarTexto } from '$lib/secciones';
import type { RequestHandler } from './$types';

// Crea un objetivo en la sección (queda al final de la pila).
export const POST: RequestHandler = async ({ params, request }) => {
	const seccionId = Number(params.id);
	const body = await request.json().catch(() => null);
	const nombre = typeof body?.nombre === 'string' ? limpiarTexto(body.nombre) : '';

	if (!nombre) return json({ error: 'Escribe un nombre para el objetivo.' }, { status: 400 });
	if (nombre.length > OBJETIVO_MAX) {
		return json({ error: `Hasta ${OBJETIVO_MAX} caracteres.` }, { status: 400 });
	}
	const existe =
		Number.isInteger(seccionId) &&
		db.select({ id: secciones.id }).from(secciones).where(eq(secciones.id, seccionId)).get();
	if (!existe) return json({ error: 'Ese proyecto no existe.' }, { status: 404 });

	const objetivo = db
		.insert(objetivos)
		.values({ seccionId, nombre })
		.returning({ id: objetivos.id, nombre: objetivos.nombre })
		.get();
	return json({ objetivo: { ...objetivo, tarjetas: [] } }, { status: 201 });
};
