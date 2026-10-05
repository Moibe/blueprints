import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';
import type { LayoutServerLoad } from './$types';

// Secciones del sidebar. `app:secciones` permite refrescarlas tras crear una (invalidate).
export const load: LayoutServerLoad = ({ depends }) => {
	depends('app:secciones');
	return {
		secciones: db
			.select({ id: secciones.id, nombre: secciones.nombre })
			.from(secciones)
			.orderBy(asc(secciones.id))
			.all()
	};
};
