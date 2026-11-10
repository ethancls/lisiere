import { auth } from '#lib/server/auth.ts';
import type { RequestHandler } from './$types';
// Explicit mount also works behind the HTTPS proxy and from the local dev origin.
export const GET: RequestHandler = ({request}) => auth.handler(request);
export const POST: RequestHandler = ({request}) => auth.handler(request);
