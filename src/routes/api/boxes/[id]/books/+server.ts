import {error, json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {pool} from '#lib/server/postgres/index.ts';
import {depositBook, listBoxBooks} from '#lib/server/postgres/books.ts';
import {bookFields} from '#lib/types/books.ts';
import {transitionOrigins} from '#lib/transition-origins.ts';

function boxId(id: string) {
 const parsed = Number(id);
 if (!/^\d+$/.test(id) || parsed < 1 || parsed > 2147483647) error(400, 'Identifiant de boîte invalide.');
 return parsed;
}

export const GET: RequestHandler = async ({params, locals}) => {
 if (!locals.user) error(401, 'Connexion requise.');
 const id = boxId(params.id);
 const books = await listBoxBooks(pool, id).catch(() => error(503, 'Les livres ne sont pas disponibles pour le moment.'));
 if (!books) error(404, 'Cette boîte n’existe pas.');
 return json({books}, {headers: {'Cache-Control': 'private, no-store'}});
};

export const POST: RequestHandler = async ({params, locals, request, url}) => {
 if (!locals.user) error(401, 'Connexion requise.');
 const origin = request.headers.get('origin');
 if (!origin || (origin !== url.origin && !transitionOrigins.some(trusted => trusted === origin))) {
  error(403, 'Origine de la demande non autorisée.');
 }
 const id = boxId(params.id);
 const input: unknown = await request.json().catch(() => error(400, 'Formulaire invalide.'));
 if (!input || typeof input !== 'object' || Array.isArray(input)) error(400, 'Formulaire invalide.');
 const parsed = {title: '', author: '', isbn: '', info: '', genre: ''};
 for (const {name, label, max, required} of bookFields) {
  const value = (input as Record<string, unknown>)[name];
  if (value === undefined && !required) continue;
  if (typeof value !== 'string' || value.includes('\0')) error(400, `${label} : valeur invalide.`);
  parsed[name] = value.trim();
  if (required && !parsed[name]) error(400, `${label} : champ obligatoire.`);
  if ([...parsed[name]].length > max) error(400, `${label} : ${max} caractères maximum.`);
 }
 const book = await depositBook(pool, id, Number(locals.user.id), {
  ...parsed, isbn: parsed.isbn || null, info: parsed.info || null, genre: parsed.genre || null
 }).catch(() => {
  console.error('Book deposit failed');
  error(503, 'Le dépôt n’a pas pu être enregistré. Rechargez la fiche avant de réessayer.');
 });
 if (!book) error(404, 'Cette boîte n’existe pas.');
 return json({book}, {status: 201});
};
