import { json, redirect, type Handle } from '@sveltejs/kit';
import { COOKIE, authActiva, sesionValida } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	if (!authActiva()) return resolve(event);

	event.locals.autenticado = sesionValida(event.cookies.get(COOKIE));
	if (event.locals.autenticado || event.url.pathname === '/login') return resolve(event);

	// Sin sesión: la API responde 401; las páginas mandan al login.
	if (event.url.pathname.startsWith('/api/')) {
		return json({ error: 'No autenticado.' }, { status: 401 });
	}
	if (event.request.method === 'GET') redirect(303, '/login');
	return new Response('No autenticado.', { status: 401 });
};
