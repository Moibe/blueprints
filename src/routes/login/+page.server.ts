import { fail, redirect } from '@sveltejs/kit';
import {
	COOKIE,
	SESION_SEGUNDOS,
	authActiva,
	authConfigurada,
	bloqueado,
	crearSesion,
	limpiarFallos,
	passwordCorrecta,
	registrarFallo
} from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	// Ya con sesión (o con la auth apagada en dev) no hay nada que hacer aquí.
	if (!authActiva() || locals.autenticado) redirect(303, '/');
	return { configurada: authConfigurada() };
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		if (!authConfigurada()) {
			return fail(500, { error: 'Falta ADMIN_PASSWORD en el servidor.' });
		}
		const ip = getClientAddress();
		if (bloqueado(ip)) {
			return fail(429, { error: 'Demasiados intentos. Espera unos minutos.' });
		}

		const password = (await request.formData()).get('password');
		if (typeof password !== 'string' || !passwordCorrecta(password)) {
			registrarFallo(ip);
			return fail(401, { error: 'Contraseña incorrecta.' });
		}

		limpiarFallos(ip);
		cookies.set(COOKIE, crearSesion(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: SESION_SEGUNDOS
		});
		redirect(303, '/');
	}
};
