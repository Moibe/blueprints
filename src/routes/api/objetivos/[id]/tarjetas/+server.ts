import { json } from '@sveltejs/kit';
import { eq, max } from 'drizzle-orm';
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

	// Al final del tablero.
	const { ultimo } = db
		.select({ ultimo: max(tarjetas.orden) })
		.from(tarjetas)
		.where(eq(tarjetas.objetivoId, objetivoId))
		.get() ?? { ultimo: null };

	const tarjeta = db
		.insert(tarjetas)
		.values({ objetivoId, texto, orden: (ultimo ?? 0) + 1 })
		.returning({ id: tarjetas.id, texto: tarjetas.texto, hecho: tarjetas.hecho, logrado: tarjetas.logrado, creado: tarjetas.creado })
		.get();
	return json({ tarjeta }, { status: 201 });
};

// Reacomoda las tareas del objetivo: `orden` es la lista completa de sus ids, ya en el orden
// que quedó al arrastrarlas.
export const PATCH: RequestHandler = async ({ params, request }) => {
	const objetivoId = Number(params.id);
	const body = await request.json().catch(() => null);
	const orden: unknown = body?.orden;

	if (!Array.isArray(orden) || !orden.every((id) => Number.isInteger(id))) {
		return json({ error: 'Orden inválido.' }, { status: 400 });
	}
	const suyas = Number.isInteger(objetivoId)
		? db.select({ id: tarjetas.id }).from(tarjetas).where(eq(tarjetas.objetivoId, objetivoId)).all()
		: [];
	// Tienen que ser exactamente sus tareas: ni ajenas, ni repetidas, ni faltantes.
	const ids = new Set(suyas.map((t) => t.id));
	if (orden.length !== ids.size || new Set(orden).size !== orden.length || !orden.every((id) => ids.has(id))) {
		return json({ error: 'Ese orden no corresponde a las tareas del objetivo.' }, { status: 409 });
	}

	db.transaction((tx) => {
		orden.forEach((id, i) => {
			tx.update(tarjetas).set({ orden: i + 1 }).where(eq(tarjetas.id, id)).run();
		});
	});
	return json({ ok: true });
};
