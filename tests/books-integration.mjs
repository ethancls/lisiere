import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {postgresConfig} from '../scripts/pg-config.ts';

const base = new URL(process.env.ORIGIN);
const database = new URL(process.env.POSTGRES_URL);
assert.equal(base.hostname, '127.0.0.1');
assert.equal(database.hostname, '127.0.0.1');
assert.equal(database.pathname, '/clap_books_test');

const client = new pg.Client(postgresConfig(process.env));
await client.connect();
try {
 const suffix = randomUUID();
 const auth = await fetch(new URL('/api/auth/sign-up/email', base), {
  method: 'POST', headers: {'Content-Type': 'application/json', Origin: base.origin},
  body: JSON.stringify({name: `Lecteur ${suffix}`, email: `${suffix}@example.test`, password: suffix})
 });
 assert.equal(auth.status, 200);
 const {user} = await auth.json();
 const cookie = auth.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
 assert.ok(cookie);
 const book = {title: `Le jardin ${suffix}`, author: 'Camille', isbn: '9781234567890', info: 'Un roman'};
 const request = async (id, {data, signedIn = true, origin = base.origin} = {}) => {
  const headers = signedIn ? {cookie} : {};
  if (data) Object.assign(headers, {'Content-Type': 'application/json', Origin: origin});
  const res = await fetch(new URL(`/api/boxes/${id}/books`, base), {
   headers, method: data ? 'POST' : 'GET', body: data ? JSON.stringify(data) : undefined
  });
  return {status: res.status, data: await res.json()};
 };
 const counts = async () => (await client.query(`SELECT
  (SELECT count(*) FROM bdd_clap.ouvrages) AS works,
  (SELECT count(*) FROM bdd_clap.exemplaires) AS copies,
  (SELECT count(*) FROM bdd_clap.livre_position) AS positions,
  (SELECT count(*) FROM bdd_clap.mouvements) AS movements`)).rows[0];

 const before = await counts();
 assert.equal((await request(1, {signedIn: false})).status, 401);
 assert.equal((await request(1, {data: book, signedIn: false})).status, 401);
 assert.equal((await request(1, {data: book, origin: 'https://example.test'})).status, 403);
 assert.equal((await request('invalide')).status, 400);
 assert.equal((await request(99999)).status, 404);
 assert.equal((await request(99999, {data: book})).status, 404);
 for (const fields of [{title: ' '}, {author: ''}, {title: 'x'.repeat(151)}, {author: 'x'.repeat(151)},
  {isbn: '1'.repeat(14)}, {info: 'x'.repeat(201)}, {title: 1}]) {
  const result = await request(1, {data: {...book, ...fields}});
  assert.equal(result.status, 400);
  assert.match(result.data.message, /^(Titre|Auteur|ISBN|Informations) : /);
 }
 assert.deepEqual(await counts(), before);
 assert.equal((await request(2, {data: book})).status, 503);
 assert.deepEqual(await counts(), before);
 assert.deepEqual((await request(2)).data.books, []);

 const first = await request(1, {data: {...book, title: `  ${book.title}  `, userId: -1}});
 const second = await request(1, {data: {title: book.title, author: 'Autre auteur'}});
 assert.equal(first.status, 201);
 assert.equal(second.status, 201);
 assert.notEqual(first.data.book.id, second.data.book.id);
 assert.deepEqual(first.data.book, {id: first.data.book.id, ...book});
 assert.equal(second.data.book.isbn, null);
 assert.equal(second.data.book.info, null);
 const list = await request(1);
 assert.equal(list.status, 200);
 assert.deepEqual(list.data.books.slice(0, 2), [second.data.book, first.data.book]);
 const {rows} = await client.query(`SELECT m.id_uti, m.id_boite, m.type, e.id_ouvrage
  FROM bdd_clap.mouvements m JOIN bdd_clap.exemplaires e USING (id_exemplaire)
  WHERE m.id_exemplaire = ANY ($1::integer[])`, [[first.data.book.id, second.data.book.id]]);
 assert.equal(rows.length, 2);
 assert.notEqual(rows[0].id_ouvrage, rows[1].id_ouvrage);
 assert.ok(rows.every(row => row.type === 'Depot' && row.id_boite === 1 && row.id_uti === Number(user.id)));
 console.log('OK : session, origine, boîte invalide, validation, rollback des quatre tables et dépôts distincts.');
} finally {
 await client.end();
}
