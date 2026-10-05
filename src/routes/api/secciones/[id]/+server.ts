import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';
import { NOMBRE_MAX, OBJETIVO_MAX, limpiarTexto } from '$lib/secciones';
import { nombreRepetido } from '$lib/server/secciones';
import type { RequestHandler } from './$types';

// Actualiza el nombre y/o el objetivo de una sección. Un objetivo vacío lo borra (null);
// el nombre no puede quedar vacío ni repetir el de otra sección.
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const body = await request.json().catch(() => null);
	const cambios: { nombre?: string; objetivo?: string | null } = {};

	if (typeof body?.nombre === 'string') {
		const nombre = limpiarTexto(body.nombre);
		if (!nombre) return json({ error: 'El nombre no puede quedar vacío.' }, { status: 400 });
		if (nombre.length > NOMBRE_MAX) {
			return json({ error: `El nombre puede tener hasta ${NOMBRE_MAX} caracteres.` }, { status: 400 });
		}
		if (nombreRepetido(nombre, id)) {
			return json({ error: 'Ya hay una sección con ese nombre.' }, { status: 409 });
		}
		cambios.nombre = nombre;
	}
	if (typeof body?.objetivo === 'string') {
		const objetivo = limpiarTexto(body.objetivo);
		if (objetivo.length > OBJETIVO_MAX) {
			return json({ error: `Hasta ${OBJETIVO_MAX} caracteres.` }, { status: 400 });
		}
		cambios.objetivo = objetivo || null;
	}
	if (!Number.isInteger(id) || Object.keys(cambios).length === 0) {
		return json({ error: 'Petición inválida.' }, { status: 400 });
	}

	const seccion = db.update(secciones).set(cambios).where(eq(secciones.id, id)).returning().get();
	if (!seccion) return json({ error: 'Esa sección no existe.' }, { status: 404 });
	return json({ seccion });
};
