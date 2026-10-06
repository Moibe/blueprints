import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

// Autenticación de un solo usuario: una contraseña (ADMIN_PASSWORD) y una cookie firmada
// con HMAC. No hay tabla de usuarios ni sesiones en la base: la cookie lleva su propia
// fecha de expiración y se valida con la contraseña. Cambiar ADMIN_PASSWORD cierra todas
// las sesiones abiertas.

export const COOKIE = 'bp_session';
export const SESION_SEGUNDOS = 60 * 60 * 24 * 30;

const sha256 = (s: string) => createHash('sha256').update(s).digest();

// En dev sin contraseña la app queda abierta (como antes). En producción sin contraseña
// se niega todo: nunca queda abierta por olvidar la variable.
export const authActiva = () => !(dev && !env.ADMIN_PASSWORD);
export const authConfigurada = () => !!env.ADMIN_PASSWORD;

const firmar = (payload: string) =>
	createHmac('sha256', sha256(`blueprints-session:${env.ADMIN_PASSWORD}`)).update(payload).digest('hex');

export function passwordCorrecta(intento: string): boolean {
	if (!env.ADMIN_PASSWORD) return false;
	// Se comparan los hashes (misma longitud) para no filtrar nada por tiempo.
	return timingSafeEqual(sha256(intento), sha256(env.ADMIN_PASSWORD));
}

export function crearSesion(): string {
	const expira = String(Date.now() + SESION_SEGUNDOS * 1000);
	return `${expira}.${firmar(expira)}`;
}

export function sesionValida(valor: string | undefined): boolean {
	if (!valor || !env.ADMIN_PASSWORD) return false;
	const [expira, firma, ...resto] = valor.split('.');
	if (!expira || !firma || resto.length) return false;
	// Forma estricta antes de comparar: timingSafeEqual exige la misma longitud en BYTES y
	// una cookie con caracteres no ASCII pasaría una comparación por .length y lanzaría.
	if (!/^\d{1,16}$/.test(expira) || !/^[0-9a-f]{64}$/.test(firma)) return false;
	if (!timingSafeEqual(Buffer.from(firma, 'hex'), Buffer.from(firmar(expira), 'hex'))) return false;
	return Number(expira) > Date.now();
}

// Freno a la fuerza bruta: 5 intentos fallidos por IP cada 10 minutos (en memoria; se
// reinicia con el proceso). Detrás de nginx la IP puede ser siempre 127.0.0.1 si no se
// configura ADDRESS_HEADER; para un solo usuario eso solo significa un freno global.
const VENTANA_MS = 10 * 60 * 1000;
const MAX_FALLOS = 5;
const fallos = new Map<string, number[]>();

function recientes(ip: string): number[] {
	const ahora = Date.now();
	const lista = (fallos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
	if (lista.length) fallos.set(ip, lista);
	else fallos.delete(ip);
	return lista;
}
export const bloqueado = (ip: string) => recientes(ip).length >= MAX_FALLOS;
export const registrarFallo = (ip: string) => {
	// Las entradas solo se podan al consultar su propia IP; con muchas IPs distintas (un /64
	// de IPv6) el mapa crecería sin límite. Barrido completo cuando pasa de 1000.
	if (fallos.size > 1000) {
		const ahora = Date.now();
		for (const [k, v] of fallos) if (!v.some((t) => ahora - t < VENTANA_MS)) fallos.delete(k);
	}
	fallos.set(ip, [...recientes(ip), Date.now()]);
};
export const limpiarFallos = (ip: string) => fallos.delete(ip);
