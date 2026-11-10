# Lisière

Application de boîtes à livres : SvelteKit 3, Svelte 5, TypeScript, Bits UI, Phosphor, MapLibre GL JS, Better Auth et Drizzle ORM.

## Développement

```sh
npm install
cp .env.example .env
# Compléter les secrets, la connexion PostgreSQL et le certificat.
npm run dev -- --host 0.0.0.0 --port 5173
```

Sur cette machine, la configuration est déjà présente. Le domaine public est `https://lisiere.ethancls.com` et l'accès local est `http://localhost:5173`.

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

`ORIGIN` détermine l'adresse des liens. `RESEND_API_KEY`, `RESEND_FROM` et `BETTER_AUTH_SECRET` restent dans `.env`.

## Vérification et migrations

- `npm run check` : Svelte et TypeScript.
- `npm run build` : production Node.js.
- `npm run test:auth` : avec le serveur de développement démarré, teste PostgreSQL, inscription/connexion, réinitialisation, révocation, ajout de boîte, limites des champs, référence unique, coordonnées et rechargement. Crée puis supprime uniquement ses comptes/boîtes temporaires.
- `npm run db:migrate` : migration SQL additive d'authentification (`postgres/001_auth.sql`), dans une transaction. Aucun `push` automatique du schéma métier.

Les déclarations Drizzle sont dans `src/lib/server/postgres/schema.ts`. Toute évolution du schéma existant doit passer par une migration SQL relue.

Attention pour une future intégration des mouvements : la FK actuelle `bdd_clap.mouvements.id_uti` référence `public.utilisateurs`, pas `bdd_clap.utilisateurs`. Elle est conservée et devra être traitée avant d'enregistrer des mouvements depuis l'application.

## Interface

Le système visuel est documenté dans `docs/design-system.md`, avec les retouches guidées par [unslop, Damir Sokolovsky](https://github.com/heydamir/unslop) (CC BY 4.0). Thèmes clair/sombre, logo boussole fourni par l'utilisateur, carte bord à bord et tableau triable. La disponibilité du nom Lisière n'a pas été vérifiée.

## Chargement progressif

La page serveur renvoie uniquement le profil connecté. Les boîtes viennent de `/api/boxes` : `mode=table` (pagination, tri et recherche serveur) ou `mode=map` (bornes `west`, `east`, `south`, `north`). L’index GiST existant sur `geom` est utilisé pour les vues locales. Le compte et les résultats partagent un snapshot PostgreSQL en lecture seule. Les paramètres sont validés et les appels exigent une session.

La recherche et les mouvements sont temporisés de 200 ms ; les requêtes dépassées sont annulées côté navigateur. Les erreurs proposent un nouvel essai. Les chargements affichent des placeholders Skeleton UI adaptés aux listes, tableaux, compteurs, communes et carte, avec respect de la réduction des animations. La carte importe MapLibre à la demande et utilise une source GeoJSON avec clusters, sans créer de marqueur HTML par boîte. La position est conservée entre les vues. Une zone très étendue est plafonnée à 1 000 points, avec une mention invitant à zoomer ; la liste rend au maximum 100 lieux.

Les communes sont demandées à `/api/communes` uniquement à l’ouverture du formulaire et conservées pour ses ouvertures suivantes. Après un ajout, la vue active est rechargée.

## Account settings

The header avatar opens a menu with Settings and Sign out. Migration postgres/002_profile.sql adds optional prenom and nom columns. Profile updates and password/email changes use Better Auth. Email changes require confirmation through Resend.

Run npm run test:settings to exercise profile validation, password changes, session revocation and the full email confirmation flow. It uses only delivered@resend.dev for email and removes its temporary account.


### Ajout et localisation

Le formulaire centré utilise Skeleton Dialog et une carte de positionnement. Cliquer sur la carte ou déplacer son repère remplit les coordonnées. Le bouton Me localiser demande la position au navigateur ; une saisie manuelle reste disponible. La commune est choisie dans une liste personnalisée recherchable. Adresse, commune, GPS et référence optionnelle correspondent aux colonnes existantes ; aucune migration n'est nécessaire. La réponse inclut la boîte insérée pour la sélectionner immédiatement.

La sélection sur la carte reste indépendante des chargements de zone. Un repère orange distinct remplace le point sélectionné dans les clusters. La fiche conserve adresse, code postal, commune et département, avec recentrage et ouverture Google Maps.

### Données PostgreSQL disponibles

Inspection en lecture seule du schéma bdd_clap, novembre 2026 :
- 1 945 boîtes, 622 communes et 8 départements. Les communes fournissent aussi le code INSEE.
- boite_import : références et descriptions originales ; les 1 945 noms correspondent aux références des boîtes, et les 1 945 descriptions correspondent aux adresses déjà copiées dans boites (valeurs nulles comprises).
- ouvrages : titre, auteur, ISBN, infos ; exemplaires : ouvrage et date de création.
- livre_position : boîte actuelle, date de mise à jour et confirmation ; mouvements : exemplaire, boîte, utilisateur, type et date.
- ouvrages, exemplaires, livre_position et mouvements sont actuellement vides. Ils permettent des évolutions de catalogue et de suivi, sans contenu à afficher pour l'instant.

La clé mouvements.id_uti référence encore public.utilisateurs. Il faudra corriger cette relation avant de connecter les futurs mouvements aux comptes de bdd_clap.utilisateurs.
