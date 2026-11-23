# CLAP — Collectif pour la Lecture Accessible et Partagée

Application de boîtes à livres : SvelteKit 3, Svelte 5, TypeScript, Bits UI, Phosphor, MapLibre GL JS, Better Auth et Drizzle ORM.

## Développement

```sh
npm install
cp .env.example .env
# Compléter les secrets, la connexion PostgreSQL et le certificat.
npm run dev -- --host 0.0.0.0 --port 5173
```

L’accès local est `http://localhost:5173`. Le domaine public prévu est `https://clap.ethancls.com`.

## PostgreSQL

La base `marine`, schéma `bdd_clap`, contient les boîtes, communes, départements et données de livres. Aucun de ces éléments n'est recréé par l'application.

- Lecture via Drizzle de `boites`, `communes` et `departement` ; géométrie Lambert-93 (EPSG:2154) convertie en WGS84 (EPSG:4326).
- Ajout dans `boites` : adresse (120 caractères), commune existante, point GPS, référence facultative (50 caractères, unique si renseignée). L'identifiant est généré par PostgreSQL. La géométrie est convertie vers EPSG:2154 lors de l'insertion.
- Le formulaire ne propose ni nom ni description libres : ces colonnes n'existent pas dans `boites`.
- Les communes sont sélectionnées parmi celles déjà présentes ; les tables de livres, de mouvements et les communes ne sont pas modifiées par l'ajout.
- La liste de la carte suit la zone visible et la recherche ; le tableau charge les résultats par pages de 25, 50 ou 100 lignes.

## Comptes

Better Auth utilise exclusivement PostgreSQL via Drizzle :

- `utilisateurs` : identifiant entier historique, pseudo unique, e-mail requis et unique, vérification de l'e-mail, avatar et dates.
- `lisiere_account` : comptes liés, avec mot de passe salé et haché dans `password_hash` par Better Auth.
- `lisiere_session` et `lisiere_verification` : sessions et jetons temporaires.

Les comptes de la version SQLite ont été copiés avec leurs hachages inchangés. SQLite a été retiré du code et des dépendances. La sauvegarde historique est sous `.local/legacy-sqlite/` (ignorée par Git).

L'inscription demande un pseudo, limité à 50 caractères. Le hook serveur protège les pages. Les identifiants ne sont jamais envoyés au navigateur.

## TLS

`POSTGRES_URL`, `POSTGRES_CA_FILE` et `POSTGRES_TLS_SERVERNAME` sont privés. Le serveur présente un certificat auto-signé pour `pgmarine.ethancls.com`, capturé à la première connexion dans `.local/postgres-cert.pem`. Les connexions suivantes vérifient ce certificat et son nom ; `rejectUnauthorized` reste activé. Pour une autre machine, fournir ce certificat ou une CA vérifiée. Son changement exige une mise à jour explicite du fichier de confiance.

## Mot de passe oublié

`/forgot-password` envoie un lien Resend depuis `noreply@mail.ethancls.com`. `/reset-password` vérifie la confirmation et les règles du nouveau mot de passe. Les jetons expirent après 30 minutes, sont à usage unique et révoquent les sessions après modification. Les endpoints sont limités en fréquence. Les erreurs de transport ne sont plus présentées comme un envoi réussi.

Définissez `ORIGIN=http://localhost:5173` en local et `ORIGIN=https://clap.ethancls.com` lors du déploiement sur le nouveau domaine. Utilisez l’origine publique exacte (schéma et hôte, sans chemin) : l’adaptateur Node et Better Auth l’utilisent pour les requêtes, et les liens de confirmation et de réinitialisation la reprennent. Les sessions et préférences enregistrées sur l’ancien domaine ne sont pas transférées par le navigateur.

Pendant la transition, les formulaires et Better Auth acceptent les deux origines HTTPS exactes. Les nouveaux liens utilisent toujours `ORIGIN`, même si la demande vient de l’autre domaine. Gardez les deux domaines accessibles en HTTPS jusqu’à expiration des liens déjà envoyés ; ne redirigez pas les requêtes d’authentification vers l’autre domaine. Les liens de réinitialisation restent valables au plus 30 minutes et ne sont utilisables qu’une fois.

`RESEND_API_KEY`, `RESEND_FROM` (adresse d’expédition vérifiée chez Resend) et `BETTER_AUTH_SECRET` restent dans `.env`. Les aperçus ne doivent pas réutiliser la connexion PostgreSQL de production.

## Vérification et migrations

- `npm run check` : Svelte et TypeScript.
- `npm run build` : production Node.js.
- `npm run test:auth` : avec le serveur de développement démarré, teste PostgreSQL, inscription/connexion, réinitialisation, révocation, ajout de boîte, limites des champs, référence unique, coordonnées et rechargement. Crée puis supprime uniquement ses comptes/boîtes temporaires.
- `npm run db:migrate` : rejoue les migrations SQL versionnées dans une transaction. Aucun `push` automatique du schéma métier.

Les déclarations Drizzle sont dans `src/lib/server/postgres/schema.ts`. Toute évolution du schéma existant doit passer par une migration SQL relue.

`postgres/003_mouvements_fk.sql` rattache `bdd_clap.mouvements.id_uti` à `bdd_clap.utilisateurs`. La contrainte précédente n'était pas qualifiée et se résolvait vers `public.utilisateurs` par le `search_path` du rôle : elle est supprimée et recréée à sémantique identique (FK simple, `NO ACTION`).

## Interface

Le système visuel est documenté dans `docs/design-system.md`, avec les retouches guidées par [unslop, Damir Sokolovsky](https://github.com/heydamir/unslop) (CC BY 4.0). Thèmes clair/sombre, logo aux quatre livres fourni par Marine, carte bord à bord et tableau triable.

## Chargement progressif

La page serveur renvoie uniquement le profil connecté. Les boîtes viennent de `/api/boxes` : `mode=table` (pagination, tri et recherche serveur) ou `mode=map`. Sans filtres, la carte utilise ses bornes (`west`, `east`, `south`, `north`) et l’index GiST existant sur `geom` pour les vues locales. Le compte et les résultats partagent un snapshot PostgreSQL en lecture seule. Les paramètres sont validés et les appels exigent une session.

Les filtres de la carte se cumulent : commune, département, présence de livres, titre et genre. La carte cadre les résultats dans tout le catalogue, y compris hors de la zone initiale. Jusqu’à 1 000 boîtes sont affichées dans la liste et sur la carte ; le nombre total de correspondances reste indiqué. Le titre et le genre sont des fragments de texte (casse ignorée, accents conservés) et doivent correspondre au même exemplaire actuellement rattaché à la boîte par `livre_position`. Réinitialiser rétablit l’exploration par cadrage. Le tableau garde sa recherche de boîtes indépendante.

La recherche et les mouvements sont temporisés de 200 ms ; les requêtes dépassées sont annulées côté navigateur. Les erreurs proposent un nouvel essai. Les chargements affichent des placeholders Skeleton UI adaptés aux listes, tableaux, compteurs, communes et carte, avec respect de la réduction des animations. La carte importe MapLibre à la demande et utilise une source GeoJSON avec clusters, sans créer de marqueur HTML par boîte. La position est conservée entre les vues. Une zone très étendue est plafonnée à 1 000 points, avec une mention invitant à zoomer ; la liste rend au maximum 100 lieux.

Les communes sont demandées à `/api/communes` uniquement à l’ouverture du formulaire et conservées pour ses ouvertures suivantes. Après un ajout, la vue active est rechargée.

## Account settings

The header avatar opens a menu with Settings and Sign out. Migration postgres/002_profile.sql adds optional prenom and nom columns. Profile updates and password/email changes use Better Auth. Email changes require confirmation through Resend.

Run npm run test:settings to exercise profile validation, password changes, session revocation and the full email confirmation flow. It uses only delivered@resend.dev for email and removes its temporary account.


### Ajout et localisation

Le formulaire détermine la commune à partir du point choisi sur la carte, de la position autorisée par le navigateur ou des coordonnées saisies. Le serveur vérifie à nouveau au moment de l’ajout : une seule commune doit être trouvée par l’API Découpage administratif, et son code INSEE doit correspondre au catalogue. En cas de panne de cette vérification, réessayez ; si le point est hors catalogue, déplacez le repère. Aucune migration n’est nécessaire.

L’IGN fournit une suggestion d’adresse modifiable, sans déplacer le repère. Seules les coordonnées et les paramètres de recherche sont envoyés aux deux services, sans les données de session. Après un délai dépassé, une erreur réseau ou un HTTP 502/503/504, l’application réessaie l’IGN une fois (4 s, puis 3 s au maximum). Si l’IGN ne répond pas, on peut toujours saisir l’adresse et ajouter la boîte si la commune a été vérifiée. Un résultat valide sans adresse proche n’est pas une panne. Les journaux serveur indiquent le motif d’un échec IGN sans les coordonnées.

La sélection sur la carte reste indépendante des chargements de zone. Un repère pêche distinct remplace le point sélectionné dans les clusters. La fiche conserve adresse, code postal, commune et département, avec recentrage et ouverture Google Maps.

### Données PostgreSQL disponibles

Inspection en lecture seule du schéma bdd_clap, novembre 2026 :
- 1 945 boîtes, 622 communes et 8 départements. Les communes fournissent aussi le code INSEE.
- boite_import : références et descriptions originales ; les 1 945 noms correspondent aux références des boîtes, et les 1 945 descriptions correspondent aux adresses déjà copiées dans boites (valeurs nulles comprises).
- ouvrages : titre, auteur, ISBN, infos ; exemplaires : ouvrage et date de création.
- livre_position : boîte actuelle, date de mise à jour et confirmation ; mouvements : exemplaire, boîte, utilisateur, type et date.
- ouvrages, exemplaires, livre_position et mouvements sont actuellement vides. Ils permettent des évolutions de catalogue et de suivi, sans contenu à afficher pour l'instant.

La clé mouvements.id_uti est désormais rattachée à bdd_clap.utilisateurs par postgres/003_mouvements_fk.sql, et non plus à public.utilisateurs.

### Déposer un livre

Depuis la fiche d’une boîte, une personne connectée peut déposer un livre en renseignant son titre et son auteur, avec un genre libre, un ISBN et des informations facultatifs. La fiche se recharge après confirmation et affiche les exemplaires actuellement liés à cette boîte par `livre_position`.

Chaque dépôt crée un ouvrage et un exemplaire distincts, puis enregistre la position et un mouvement `Depot` associé au compte connecté. Les quatre écritures partagent une transaction. La migration `005_genre_ouvrage.sql` ajoute uniquement la colonne nullable `bdd_clap.ouvrages.genre` (80 caractères), sans modifier les ouvrages existants ; elle doit être appliquée avant de démarrer cette version.

Pour vérifier le dépôt et les filtres sans toucher aux données réelles, créer une base PostgreSQL/PostGIS jetable nommée `clap_books_test` sur `127.0.0.1`. Y charger `tests/books-fixture.sql`, puis exécuter `node --env-file=CHEMIN_ENV_TEST scripts/migrate-postgres.ts` avec une configuration TLS de test pointant vers cette base. Démarrer l’application sur `127.0.0.1` et exécuter `node --env-file=CHEMIN_ENV_TEST tests/books-integration.mjs` et `node --env-file=CHEMIN_ENV_TEST tests/map-filters-integration.mjs` avec le même environnement. La deuxième boîte de la fixture force une erreur au dernier insert pour vérifier le rollback.
