import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';
import { NOMBRE_MAX, limpiarNombre } from '$lib/secciones';
import type { RequestHandler } from './$types';

// Crea una sección. Responde 201 con la sección, o 400/409 con un mensaje que el modal muestra tal cual.
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const nombre = typeof body?.nombre === 'string' ? limpiarNombre(body.nombre) : '';

	if (!nombre) return json({ error: 'Escribe un nombre para la sección.' }, { status: 400 });
	if (nombre.length > NOMBRE_MAX) {
		return json({ error: `El nombre puede tener hasta ${NOMBRE_MAX} caracteres.` }, { status: 400 });
	}

	// Se compara en JS y no con lower() de SQLite, que solo baja letras ASCII (no Á, Ñ…).
	const clave = nombre.toLocaleLowerCase('es');
	const repetida = db
		.select({ nombre: secciones.nombre })
		.from(secciones)
		.all()
		.some((s) => s.nombre.toLocaleLowerCase('es') === clave);
	if (repetida) return json({ error: 'Ya hay una sección con ese nombre.' }, { status: 409 });

	const seccion = db.insert(secciones).values({ nombre }).returning().get();
	return json({ seccion }, { status: 201 });
};
