CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA bdd_clap;

CREATE TABLE bdd_clap.utilisateurs (
 id_uti serial PRIMARY KEY, pseudo varchar(50) NOT NULL UNIQUE, date_inscrip date DEFAULT now()
);
CREATE TABLE bdd_clap.departement (
 id_dept integer PRIMARY KEY, nom varchar(30) NOT NULL, code varchar(3) NOT NULL
);
CREATE TABLE bdd_clap.communes (
 id_commune integer PRIMARY KEY, nom_officiel varchar(200) NOT NULL, code_postal varchar(5) NOT NULL,
 code_insee varchar(5), id_dept integer NOT NULL REFERENCES bdd_clap.departement
);
CREATE TABLE bdd_clap.boites (
 id_boite serial PRIMARY KEY, ref_source varchar(50), adresse varchar(120),
 id_commune integer NOT NULL REFERENCES bdd_clap.communes, geom geometry(point, 2154)
);
CREATE TABLE bdd_clap.ouvrages (
 id_ouvrage serial PRIMARY KEY, titre varchar(150) NOT NULL, auteur varchar(150),
 isbn varchar(13), infos varchar(200)
);
CREATE TABLE bdd_clap.exemplaires (
 id_exemplaire serial PRIMARY KEY, id_ouvrage integer NOT NULL REFERENCES bdd_clap.ouvrages,
 date_creation timestamp DEFAULT now()
);
CREATE TABLE bdd_clap.livre_position (
 id_exemplaire integer PRIMARY KEY REFERENCES bdd_clap.exemplaires, id_boite integer REFERENCES bdd_clap.boites,
 date_maj timestamp DEFAULT now(), date_confirmation timestamp
);
CREATE TABLE bdd_clap.mouvements (
 id_mouvement serial PRIMARY KEY, id_exemplaire integer REFERENCES bdd_clap.exemplaires,
 id_boite integer REFERENCES bdd_clap.boites, id_uti integer REFERENCES bdd_clap.utilisateurs,
 type varchar(10) NOT NULL CHECK (type IN ('Depot', 'Retrait')), date_operation timestamp DEFAULT now(),
 CONSTRAINT test_echec_dernier_insert CHECK (id_boite <> 2)
);

INSERT INTO bdd_clap.departement VALUES (1, 'Paris', '75');
INSERT INTO bdd_clap.communes VALUES (1, 'Paris', '75004', '75056', 1);
INSERT INTO bdd_clap.boites (ref_source, adresse, id_commune, geom) VALUES
 ('Boîte du square', '12, rue du Square', 1, ST_Transform(ST_SetSRID(ST_MakePoint(2.35, 48.862), 4326), 2154)),
 ('Boîte de vérification du rollback', '8, rue des Lilas', 1, ST_Transform(ST_SetSRID(ST_MakePoint(2.36, 48.864), 4326), 2154));
