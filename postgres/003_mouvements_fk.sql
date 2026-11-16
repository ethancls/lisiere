-- Raccroche bdd_clap.mouvements.id_uti à bdd_clap.utilisateurs.
--
-- Définition d'origine, telle que pg_get_constraintdef la renvoyait :
--   FOREIGN KEY (id_uti) REFERENCES utilisateurs(id_uti)
-- La référence n'était pas qualifiée : le search_path du rôle ("$user", public, topology, tiger)
-- la résolvait vers public.utilisateurs, l'ancienne table, et non vers les comptes Better Auth
-- de bdd_clap.utilisateurs. Sémantique reproduite à l'identique : FK simple, NO ACTION sur UPDATE
-- et sur DELETE, non différée. id_uti est integer des deux côtés : aucun changement de type.
--
-- Ce fichier est rejoué à chaque exécution de db:migrate, dans une transaction unique : le
-- DROP IF EXISTS suivi du ADD rend la paire idempotente.

-- Une ligne orpheline signalerait un compte absent de bdd_clap.utilisateurs : on échoue ici,
-- avant toute modification, plutôt que de contourner la contrainte.
-- Dans ce cas : rattacher ces id_uti à un compte existant, ou les remettre à NULL s'ils n'ont pas
-- de sens (UPDATE bdd_clap.mouvements SET id_uti = NULL WHERE id_uti IN (...)), puis rejouer.
DO $$
DECLARE orphelins integer;
BEGIN
 SELECT count(*) INTO orphelins
 FROM bdd_clap.mouvements m
 WHERE m.id_uti IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM bdd_clap.utilisateurs u WHERE u.id_uti = m.id_uti);
 IF orphelins > 0 THEN
  RAISE EXCEPTION 'bdd_clap.mouvements.id_uti : % ligne(s) sans compte correspondant dans bdd_clap.utilisateurs', orphelins
   USING HINT = 'Rattachez ces id_uti a un compte existant, ou mettez-les a NULL, avant de rejouer db:migrate.';
 END IF;
END $$;

ALTER TABLE bdd_clap.mouvements DROP CONSTRAINT IF EXISTS mouvements_id_uti_fkey;
ALTER TABLE bdd_clap.mouvements ADD CONSTRAINT mouvements_id_uti_fkey
 FOREIGN KEY (id_uti) REFERENCES bdd_clap.utilisateurs(id_uti);
