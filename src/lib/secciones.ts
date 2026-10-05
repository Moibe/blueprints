// Reglas de las secciones compartidas entre el modal (cliente) y el endpoint (servidor).

export const NOMBRE_MAX = 40;

/** Clave de hoja que se muestra en el sidebar y en el rótulo: 1 → "A-01". */
export const codigoHoja = (id: number) => `A-${String(id).padStart(2, '0')}`;

/** Quita espacios sobrantes: "  Planta   alta " → "Planta alta". */
export const limpiarNombre = (nombre: string) => nombre.trim().replace(/\s+/g, ' ');
