import { json, redirect, type Handle } from '@sveltejs/kit';
import { COOKIE, authActiva, sesionValida } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	if (!authActiva()) return resolve(event);

	event.locals.autenticado = sesionValida(event.cookies.get(COOKIE));
	// /logout pasa sin sesión: un "Salir" con la cookie ya vencida debe llevar al login, no a un 401.
	const publica = event.url.pathname === '/login' || event.url.pathname === '/logout';
	if (event.locals.autenticado || publica) return resolve(event);

	// Sin sesión: la API responde 401; las páginas mandan al login.
	if (event.url.pathname.startsWith('/api/')) {
		return json({ error: 'No autenticado.' }, { status: 401 });
	}
	if (event.request.method === 'GET' || event.request.method === 'HEAD') redirect(303, '/login');
	return new Response('No autenticado.', { status: 401 });
};
