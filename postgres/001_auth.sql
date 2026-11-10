-- Additive auth migration. Business and geographic tables remain untouched.
ALTER TABLE bdd_clap.utilisateurs ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE bdd_clap.utilisateurs ADD COLUMN IF NOT EXISTS email_verifie boolean NOT NULL DEFAULT false;
ALTER TABLE bdd_clap.utilisateurs ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE bdd_clap.utilisateurs ADD COLUMN IF NOT EXISTS cree_le timestamptz NOT NULL DEFAULT now();
ALTER TABLE bdd_clap.utilisateurs ADD COLUMN IF NOT EXISTS modifie_le timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS utilisateurs_email_unique ON bdd_clap.utilisateurs (email);
CREATE UNIQUE INDEX IF NOT EXISTS utilisateurs_email_normalized_unique ON bdd_clap.utilisateurs (lower(email));
CREATE TABLE IF NOT EXISTS bdd_clap.lisiere_account (
 id text PRIMARY KEY,account_id text NOT NULL,provider_id text NOT NULL,user_id integer NOT NULL REFERENCES bdd_clap.utilisateurs(id_uti) ON DELETE CASCADE,
 password_hash text,access_token text,refresh_token text,id_token text,access_token_expires_at timestamptz,refresh_token_expires_at timestamptz,scope text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(provider_id,account_id)
);
CREATE TABLE IF NOT EXISTS bdd_clap.lisiere_session (
 id text PRIMARY KEY,token text NOT NULL UNIQUE,user_id integer NOT NULL REFERENCES bdd_clap.utilisateurs(id_uti) ON DELETE CASCADE,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),ip_address text,user_agent text
);
CREATE INDEX IF NOT EXISTS lisiere_session_user_idx ON bdd_clap.lisiere_session(user_id);
CREATE TABLE IF NOT EXISTS bdd_clap.lisiere_verification (
 id text PRIMARY KEY,identifier text NOT NULL,value text NOT NULL,expires_at timestamptz NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lisiere_verification_identifier_idx ON bdd_clap.lisiere_verification(identifier);
