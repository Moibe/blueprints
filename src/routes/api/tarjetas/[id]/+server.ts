import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { tarjetas } from '$lib/server/db/schema';
import { TARJETA_MAX, limpiarTexto } from '$lib/secciones';
import type { RequestHandler } from './$types';

const columnas = { id: tarjetas.id, texto: tarjetas.texto, hecho: tarjetas.hecho, logrado: tarjetas.logrado, creado: tarjetas.creado };

// Edita el texto y/o la paloma de una tarjeta.
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	const body = await request.json().catch(() => null);
	const cambios: { texto?: string; hecho?: boolean; logrado?: Date | null } = {};

	if (typeof body?.texto === 'string') {
		const texto = limpiarTexto(body.texto);
		if (!texto) return json({ error: 'La tarjeta necesita texto.' }, { status: 400 });
		if (texto.length > TARJETA_MAX) {
			return json({ error: `Hasta ${TARJETA_MAX} caracteres.` }, { status: 400 });
		}
		cambios.texto = texto;
	}
	if (typeof body?.hecho === 'boolean') {
		cambios.hecho = body.hecho;
		cambios.logrado = body.hecho ? new Date() : null;
	}
	if (!Number.isInteger(id) || Object.keys(cambios).length === 0) {
		return json({ error: 'Petición inválida.' }, { status: 400 });
	}

	const tarjeta = db.update(tarjetas).set(cambios).where(eq(tarjetas.id, id)).returning(columnas).get();
	if (!tarjeta) return json({ error: 'Esa tarjeta no existe.' }, { status: 404 });
	return json({ tarjeta });
};

// Borra una tarjeta (se usa cuando se le quita todo el texto).
export const DELETE: RequestHandler = ({ params }) => {
	const id = Number(params.id);
	const borrada = Number.isInteger(id) && db.delete(tarjetas).where(eq(tarjetas.id, id)).run().changes > 0;
	if (!borrada) return json({ error: 'Esa tarjeta no existe.' }, { status: 404 });
	return json({ ok: true });
};
