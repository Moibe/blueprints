import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { secciones, tarjetas } from '$lib/server/db/schema';
import { TARJETA_MAX, limpiarTexto } from '$lib/secciones';
import type { RequestHandler } from './$types';

// Crea una tarjeta en el área de dibujo de la sección.
export const POST: RequestHandler = async ({ params, request }) => {
	const seccionId = Number(params.id);
	const body = await request.json().catch(() => null);
	const texto = typeof body?.texto === 'string' ? limpiarTexto(body.texto) : '';

	if (!texto) return json({ error: 'La tarjeta necesita texto.' }, { status: 400 });
	if (texto.length > TARJETA_MAX) {
		return json({ error: `Hasta ${TARJETA_MAX} caracteres.` }, { status: 400 });
	}
	const existe =
		Number.isInteger(seccionId) &&
		db.select({ id: secciones.id }).from(secciones).where(eq(secciones.id, seccionId)).get();
	if (!existe) return json({ error: 'Esa sección no existe.' }, { status: 404 });

	const tarjeta = db
		.insert(tarjetas)
		.values({ seccionId, texto })
		.returning({ id: tarjetas.id, texto: tarjetas.texto, hecho: tarjetas.hecho })
		.get();
	return json({ tarjeta }, { status: 201 });
};
