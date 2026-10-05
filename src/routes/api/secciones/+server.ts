import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';
import { NOMBRE_MAX, limpiarTexto } from '$lib/secciones';
import { nombreRepetido } from '$lib/server/secciones';
import type { RequestHandler } from './$types';

// Crea una sección. Responde 201 con la sección, o 400/409 con un mensaje que el modal muestra tal cual.
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const nombre = typeof body?.nombre === 'string' ? limpiarTexto(body.nombre) : '';

	if (!nombre) return json({ error: 'Escribe un nombre para la sección.' }, { status: 400 });
	if (nombre.length > NOMBRE_MAX) {
		return json({ error: `El nombre puede tener hasta ${NOMBRE_MAX} caracteres.` }, { status: 400 });
	}

	if (nombreRepetido(nombre)) {
		return json({ error: 'Ya hay una sección con ese nombre.' }, { status: 409 });
	}

	const seccion = db.insert(secciones).values({ nombre }).returning().get();
	return json({ seccion }, { status: 201 });
};
