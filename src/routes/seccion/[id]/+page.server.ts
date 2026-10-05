import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const id = Number(params.id);
	const seccion = Number.isInteger(id)
		? db.select().from(secciones).where(eq(secciones.id, id)).get()
		: undefined;
	if (!seccion) error(404, 'Esa sección no existe');
	return { seccion };
};
