import { error } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { secciones, tarjetas } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const seccion = Number.isInteger(id)
		? db.select().from(secciones).where(eq(secciones.id, id)).get()
		: undefined;
	if (!seccion) error(404, 'Esa sección no existe');
	return {
		seccion,
		tarjetas: db
			.select({ id: tarjetas.id, texto: tarjetas.texto, hecho: tarjetas.hecho })
			.from(tarjetas)
			.where(eq(tarjetas.seccionId, id))
			.orderBy(asc(tarjetas.id))
			.all()
	};
};
