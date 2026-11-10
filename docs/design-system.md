# Lisière — Account UI

Polish workflow: [unslop by Damir Sokolovsky](https://github.com/heydamir/unslop), CC BY 4.0.

Scope: login, signup, password recovery. Preserve the user's approved wording and split layout; the green gradient remains by explicit request.

## Direction

- Product: find and contribute neighbourhood book boxes.
- Character: literary, calm, approachable.
- World: books, neighbourhood streets, shared shelves.
- Moments: the user-supplied compass mark and the green story panel.
- Signature: one compass mark in the primary colour.

## Audit and treatment

- Auth controls had unrelated pill and field radii: 8px controls, 12px segmented container with 4px inset.
- Several one-off spaces: use 4px rhythm for form groups and controls.
- Hardcoded dark colours prevented a light theme: shared semantic tokens for surfaces, text, borders, accent and validation.
- Bright green cannot serve as readable text on white: use moss green in light mode, retain the original green in dark mode.
- Generic login failure mixed credentials and password requirements: separate wrong credentials, signup validation, rate limits and service failure.
- Repeated footer slogan: removed at user request.
- Uppercase tracked copy and greeting headings are retained where previously approved by the user.

## Theme and components

Theme follows the OS until changed, then persists in `lisiere-theme` in local storage and a SameSite=Lax cookie. The server renders the saved theme on the HTML element; critical background colours and an early script prevent a mismatched first paint. The switch is a 44px sun/moon icon button in the account shell. No motion on theme changes.

Phosphor (`phosphor-svelte`, imports directs) supplies interface icons; the compass logo is supplied by the user. Dark primary #b7ef74, light primary #3c661f. Error and success states use semantic tokens and text/icons together.

Story panel: 56px right corners on desktop/tablet, 40px bottom corners on mobile. Mobile inputs use 16px text to avoid automatic zoom.

The story panel occupies 48% of desktop/tablet width. The theme toggle has no border or background; its 44px hit area and keyboard focus ring remain.

Tab titles follow `Lisière | Page name`, including the client-side signup mode. The dedicated favicon uses the compass on a dark rounded tile for contrast in browser chrome.

## Homepage

Unslop audit: decorative hero, repeated slogans, redundant sidebar and colour-coded result tiles displaced the map. Replace them with a compact command row, one view switch, a map canvas and neutral result rows. Keep the brand and the green accent; preserve all existing data and add-box behavior.

Direction: a neighbourhood atlas, calm and practical. The map is the visual content. The compass mark and selected map pins carry the accent. The table uses 72px rows, sticky headings, column sorting and the same search as the map. No marketing copy or decorative panels.

Map uses OpenFreeMap Positron in light mode and Dark in dark mode. On mobile, commands wrap above the map, results sit at the bottom, and the table scrolls horizontally.

### Chargement

Le tableau présente 25, 50 ou 100 lignes avec tri et pagination serveur. Retrait de la colonne Source. Les skeletons utilisent les placeholders Skeleton UI avec une pulsation légère, désactivée par `prefers-reduced-motion`. Les chargements sont annoncés aux lecteurs d’écran. Les erreurs ont une action Réessayer. La carte conserve ses points précédents pendant une mise à jour et groupe les points proches dans une couche GeoJSON. Les limites d'une vue très étendue sont affichées explicitement.

### Skeleton UI

Le skill `skeleton-ui` fourni par l’utilisateur est installé sous `~/.codex/skills/skeleton-ui/SKILL.md`. Les états de chargement utilisent les styled elements officiels `placeholder` et `placeholder-circle` de `@skeletonlabs/skeleton` v5. `LoadingSkeleton.svelte` compose les formes selon le contenu attendu : lignes de lieux, quatre cellules de tableau, compteurs, champ commune et surface de carte. Les formes décoratives sont masquées aux lecteurs d’écran ; une seule annonce est conservée par chargement.

Tailwind v4 et son plugin Vite sont installés sans Preflight. La détection des utilities est limitée au composant de chargement. La palette est reliée aux tokens Lisière ; les interactions Bits UI existantes sont conservées. Le paquet `@skeletonlabs/skeleton-svelte` est disponible pour les nouveaux composants, avec consultation de sa documentation avant utilisation.

## Account header and settings

AppHeader is shared by the map and settings. Fixed control sizes and a 164px add button (40px on mobile) prevent hydration shifts. ThemeToggle uses its inline layout during SSR. Search has one group focus ring. The avatar opens a Skeleton Menu with Settings above Sign out. Buttons change icon colour on hover. The account popup is the exception: Settings uses accent text and a light accent background on hover/focus, while Sign out uses negative text and a light negative background.

UserAvatar uses Skeleton Avatar, a monogram from first/last names or the username, and a deterministic colour derived from the user ID. No third-party avatar request.

/settings includes profile, email and password forms using Skeleton styled elements. The current password is required for email and password changes. Email changes require Resend confirmation before updating the address; already verified addresses also require approval from the old address. Other sessions are revoked on password change.

The explorer counter shows the number of rendered places against the full database total. The API returns totalAll independently of viewport, search and pagination.


## Application polish, November 2026

Direction (unslop by Damir Sokolovsky, CC BY 4.0):
- Product: find and contribute neighbourhood book exchanges.
- Character: calm, practical, bookish.
- World: street maps and shared books.
- Moments: the working map and the approved account story panel.
- Signature: the green compass, echoed by selected map points.

Audit: inconsistent control radii in the add dialog; arbitrary modal gaps; uppercase tracked account labels; native page-size picker; padded row numbers; inconsistent number formatting; hidden mobile counter; different popup surface treatments. This is a polish pass within the existing direction. Preserve the approved account copy, palette, typefaces, story treatment and page structure.

Applied in pass order: spacing on a 4px grid; shared semantic surface and popup tokens; Phosphor control icons; shorter functional profile/search copy; sentence-case account labels and French tabular numbers; visible mobile counts and wrapping pagination; 8px controls, 12px popups and 16px modal corners; map retained as the content visual; explicit 160ms colour/surface transitions with reduced-motion support.

The page-size picker uses the existing Bits UI Select with a portal, keyboard selection, a selected checkmark, collision handling and a controlled 25/50/100 value. Skeleton v5 exposes only a styled native select, so the explicit custom-picker requirement uses Bits primitives and the shared styled-element classes. Server pagination remains unchanged.

Map attribution controls are disabled at the user's explicit request for this personal application.


## Location entry and selection

AddBox now uses Skeleton Dialog and a flex positioner centred in the viewport, with no translation on the content. The previous .dialog class combined Skeleton translate with the app transform, moving the form twice. The new names avoid that collision. The dialog scrolls within the viewport, retains its fields after errors, and has a sticky footer. Desktop uses fields beside the location map; mobile puts the map above the fields.

Commune selection uses Skeleton Combobox, with accent-insensitive name/postcode search and stable database IDs. Its popup stays inside the dialog focus boundary. An arbitrary typed commune cannot be submitted.

LocationPicker accepts a click, a draggable/keyboard-accessible marker or explicit coordinates. Geolocation runs only after the Me localiser button is activated. Denial, timeout and unavailable map states offer the manual alternative. No reverse-geocoding service or location lookup is called automatically. Coordinates are validated on both sides and transformed to EPSG:2154 by PostgreSQL. The action returns the inserted box for immediate selection.

Selected boxes live independently of the viewport result set. A separate orange pin stays visible during requests and outside clustering. Repeated selection triggers framing again. Camera offset uses the actual results-panel rectangle and resets map padding, avoiding accumulated offsets. Mobile replaces the list with the selected detail card until it is closed. The detail card includes address, postcode, commune and department, plus recenter and Google Maps actions.

Google Maps links follow the universal search URL format using encoded GPS coordinates: https://developers.google.com/maps/documentation/urls/get-started .
