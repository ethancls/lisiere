-- Supprime la table legacy public.utilisateurs.
--
-- Elle était la cible de toute référence non qualifiée écrite par le rôle bddclap, dont le
-- search_path contient public : c'est ce qui a produit la FK mouvements.id_uti mal rattachée,
-- corrigée par postgres/003_mouvements_fk.sql. L'application n'utilise que bdd_clap.utilisateurs
-- (src/lib/server/postgres/schema.ts, pgSchema('bdd_clap')), et les tests aussi.
--
-- DDL d'origine, tel que pg_catalog le décrivait avant suppression. Pour restaurer, rejouer ce
-- bloc : le type serial recrée la séquence public.utilisateurs_id_uti_seq.
--   CREATE TABLE public.utilisateurs (
--     id_uti integer NOT NULL DEFAULT nextval('public.utilisateurs_id_uti_seq'::regclass),
--     pseudo character varying(50) NOT NULL,
--     date_inscrip date DEFAULT CURRENT_DATE
--   );
--   ALTER TABLE ONLY public.utilisateurs ADD CONSTRAINT utilisateurs_pkey PRIMARY KEY (id_uti);
--   ALTER TABLE ONLY public.utilisateurs ADD CONSTRAINT utilisateurs_pseudo_key UNIQUE (pseudo);
--   CREATE UNIQUE INDEX utilisateurs_pkey ON public.utilisateurs USING btree (id_uti);
--   CREATE UNIQUE INDEX utilisateurs_pseudo_key ON public.utilisateurs USING btree (pseudo);
--   CREATE SEQUENCE public.utilisateurs_id_uti_seq
--     AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
--   ALTER SEQUENCE public.utilisateurs_id_uti_seq OWNED BY public.utilisateurs.id_uti;
--   GRANT ALL ON TABLE public.utilisateurs TO bddclap;
-- La séquence est possédée par la table (pg_depend, deptype 'a') : elle part avec le DROP TABLE.
-- Elle est distincte de bdd_clap.utilisateurs_id_uti_seq, qui sert les comptes Better Auth.
--
-- Vérifié avant d'écrire cette migration : aucune FK ne la référence (pg_constraint.confrelid),
-- aucune vue ni matview, aucune fonction, aucun trigger, aucune règle, droits à bddclap seul,
-- 0 ligne. Le DROP est volontairement sans CASCADE : si un dépendant apparaît d'ici l'exécution,
-- la migration échoue bruyamment plutôt que d'emporter l'objet avec elle.
--
-- Ce fichier est rejoué à chaque exécution de db:migrate, dans une transaction unique : si la
-- table n'existe plus, le bloc de garde sort sans rien faire et les DROP IF EXISTS sont neutres.

-- Refuse de détruire des données : une table non vide signifie que quelqu'un a écrit dans cette
-- table depuis la vérification, et la suppression ne doit alors pas se poursuivre sans décision.
-- Dans ce cas : vider public.utilisateurs (TRUNCATE), ou déplacer ses lignes vers
-- bdd_clap.utilisateurs, puis rejouer db:migrate.
DO $$
DECLARE lignes bigint;
BEGIN
 IF to_regclass('public.utilisateurs') IS NULL THEN
  RETURN;
 END IF;
 EXECUTE 'SELECT count(*) FROM public.utilisateurs' INTO lignes;
 IF lignes > 0 THEN
  RAISE EXCEPTION 'public.utilisateurs contient encore % ligne(s) : suppression refusee', lignes
   USING HINT = 'Videz ou deplacez ces lignes (TRUNCATE public.utilisateurs, ou copie vers bdd_clap.utilisateurs) avant de rejouer db:migrate.';
 END IF;
END $$;

DROP TABLE IF EXISTS public.utilisateurs;

-- Filet de sécurité pour le cas où la séquence ne serait plus possédée par la table (elle l'est
-- aujourd'hui, deptype 'a') : aucune séquence orpheline ne doit rester. Sans CASCADE, donc si une
-- colonne quelconque l'utilise encore, la migration échoue au lieu de casser son DEFAULT.
DROP SEQUENCE IF EXISTS public.utilisateurs_id_uti_seq;
