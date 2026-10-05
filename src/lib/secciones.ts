// Reglas de las secciones compartidas entre el cliente (modal, rótulo) y los endpoints.

export const NOMBRE_MAX = 40;
export const OBJETIVO_MAX = 140;

/** Clave de hoja que se muestra en el sidebar y en el rótulo: 1 → "A-01". */
export const codigoHoja = (id: number) => `A-${String(id).padStart(2, '0')}`;

/** Quita espacios y saltos sobrantes: "  Planta   alta " → "Planta alta". */
export const limpiarTexto = (texto: string) => texto.trim().replace(/\s+/g, ' ');
