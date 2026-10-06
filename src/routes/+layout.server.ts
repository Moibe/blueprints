import { asc } from 'drizzle-orm';
import { authActiva } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';
import type { LayoutServerLoad } from './$types';

// Secciones del sidebar. `app:secciones` permite refrescarlas tras crear una (invalidate).
export const load: LayoutServerLoad = ({ depends, locals }) => {
	depends('app:secciones');
	// En /login (sin sesión) no se expone nada de la base.
	if (!locals.autenticado && authActiva()) return { secciones: [], conSesion: false };
	return {
		conSesion: authActiva(),
		secciones: db
			.select({ id: secciones.id, nombre: secciones.nombre })
			.from(secciones)
			.orderBy(asc(secciones.id))
			.all()
	};
};
