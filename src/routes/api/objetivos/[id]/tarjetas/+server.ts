import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { objetivos, tarjetas } from '$lib/server/db/schema';
import { TARJETA_MAX, limpiarTexto } from '$lib/secciones';
import type { RequestHandler } from './$types';

// Crea una tarea en el objetivo.
export const POST: RequestHandler = async ({ params, request }) => {
	const objetivoId = Number(params.id);
	const body = await request.json().catch(() => null);
	const texto = typeof body?.texto === 'string' ? limpiarTexto(body.texto) : '';

	if (!texto) return json({ error: 'La tarea necesita texto.' }, { status: 400 });
	if (texto.length > TARJETA_MAX) {
		return json({ error: `Hasta ${TARJETA_MAX} caracteres.` }, { status: 400 });
	}
	const existe =
		Number.isInteger(objetivoId) &&
		db.select({ id: objetivos.id }).from(objetivos).where(eq(objetivos.id, objetivoId)).get();
	if (!existe) return json({ error: 'Ese objetivo no existe.' }, { status: 404 });

	const tarjeta = db
		.insert(tarjetas)
		.values({ objetivoId, texto })
		.returning({ id: tarjetas.id, texto: tarjetas.texto, hecho: tarjetas.hecho, logrado: tarjetas.logrado, creado: tarjetas.creado })
		.get();
	return json({ tarjeta }, { status: 201 });
};
