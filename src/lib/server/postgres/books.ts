import type {Pool} from 'pg';
import type {BookInput, BoxBook} from '../../types/books.ts';

export async function listBoxBooks(pool: Pool, boxId: number) {
 const {rows} = await pool.query<{books: BoxBook[]}>(`
  SELECT COALESCE((
   SELECT json_agg(json_build_object('id', e.id_exemplaire, 'title', o.titre,
    'author', o.auteur, 'isbn', o.isbn, 'info', o.infos)
    ORDER BY p.date_maj DESC NULLS LAST, e.id_exemplaire DESC)
   FROM bdd_clap.livre_position p
   JOIN bdd_clap.exemplaires e USING (id_exemplaire)
   JOIN bdd_clap.ouvrages o USING (id_ouvrage)
   WHERE p.id_boite = b.id_boite
  ), '[]'::json) AS books
  FROM bdd_clap.boites b WHERE b.id_boite = $1`, [boxId]);
 return rows[0]?.books ?? null;
}

export async function depositBook(pool: Pool, boxId: number, userId: number, book: BookInput) {
 const client = await pool.connect();
 let discard = false;
 try {
  await client.query('BEGIN');
  const box = await client.query('SELECT id_boite FROM bdd_clap.boites WHERE id_boite = $1 FOR KEY SHARE', [boxId]);
  if (!box.rowCount) {
   await client.query('ROLLBACK');
   return null;
  }
  const {rows: [work]} = await client.query<{id_ouvrage: number}>(`
   INSERT INTO bdd_clap.ouvrages (titre, auteur, isbn, infos)
   VALUES ($1, $2, $3, $4) RETURNING id_ouvrage`, [book.title, book.author, book.isbn, book.info]);
  const {rows: [copy]} = await client.query<{id_exemplaire: number}>(`
   INSERT INTO bdd_clap.exemplaires (id_ouvrage) VALUES ($1) RETURNING id_exemplaire`, [work.id_ouvrage]);
  await client.query(`
   INSERT INTO bdd_clap.livre_position (id_exemplaire, id_boite) VALUES ($1, $2)`, [copy.id_exemplaire, boxId]);
  await client.query(`
   INSERT INTO bdd_clap.mouvements (id_exemplaire, id_boite, id_uti, type)
   VALUES ($1, $2, $3, 'Depot')`, [copy.id_exemplaire, boxId, userId]);
  await client.query('COMMIT');
  return {id: copy.id_exemplaire, ...book};
 } catch (error) {
  try { await client.query('ROLLBACK'); } catch { discard = true; }
  throw error;
 } finally {
  client.release(discard);
 }
}
