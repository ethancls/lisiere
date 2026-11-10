import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
 POSTGRES_URL: { description: 'Private PostgreSQL connection URL.' },
 POSTGRES_CA_FILE: { description: 'Pinned PostgreSQL certificate file.' },
 POSTGRES_TLS_SERVERNAME: { description: 'Name checked against PostgreSQL certificate.' },
 RESEND_API_KEY: { description: 'Private Resend API key.' },
 RESEND_FROM: { description: 'Email sender on a Resend verified domain.' },
	ORIGIN: {
		description: 'The app origin (base URL), e.g. `http://localhost:5173`.'
	},
	BETTER_AUTH_SECRET: {
		description: 'Secret used to sign tokens. For production use 32 characters generated with high entropy. See [Better Auth installation](https://www.better-auth.com/docs/installation).'
	}
});
