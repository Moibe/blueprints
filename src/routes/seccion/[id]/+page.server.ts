import { error } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { objetivos, secciones, tarjetas } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const seccion = Number.isInteger(id)
		? db.select().from(secciones).where(eq(secciones.id, id)).get()
		: undefined;
	if (!seccion) error(404, 'Esa sección no existe');

	const lista = db
		.select({ id: objetivos.id, nombre: objetivos.nombre })
		.from(objetivos)
		.where(eq(objetivos.seccionId, id))
		.orderBy(asc(objetivos.id))
		.all();

	return {
		seccion,
		// Cada objetivo con sus tareas, en orden de creación.
		objetivos: lista.map((o) => ({
			...o,
			tarjetas: db
				.select({ id: tarjetas.id, texto: tarjetas.texto, hecho: tarjetas.hecho, logrado: tarjetas.logrado, creado: tarjetas.creado })
				.from(tarjetas)
				.where(eq(tarjetas.objetivoId, o.id))
				.orderBy(asc(tarjetas.id))
				.all()
		}))
	};
};
