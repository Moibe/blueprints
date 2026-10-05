import { db } from '$lib/server/db';
import { secciones } from '$lib/server/db/schema';

/**
 * ¿Ya hay otra sección con ese nombre (sin distinguir mayúsculas ni acentos en mayúscula)?
 * `excluirId` deja fuera a la propia sección al renombrarla. Se compara en JS y no con
 * lower() de SQLite, que solo baja letras ASCII (no Á, Ñ…).
 */
export function nombreRepetido(nombre: string, excluirId?: number) {
	const clave = nombre.toLocaleLowerCase('es');
	return db
		.select({ id: secciones.id, nombre: secciones.nombre })
		.from(secciones)
		.all()
		.some((s) => s.id !== excluirId && s.nombre.toLocaleLowerCase('es') === clave);
}
