# Mon classement d'écoles

Application Next.js pour classer une liste d'écoles par ordre de préférence,
avec sauvegarde locale, carte, et export Excel.

## Fonctionnalités

- **Toutes les écoles** : recherche/filtre (nom, commune, circonscription, RNE)
  et ajout au classement en un clic.
- **Mon classement** : liste ordonnée, réorganisable par glisser-déposer ou
  avec les flèches ↑ / ↓, suppression individuelle.
- **Sauvegarde automatique** : le classement est stocké dans le
  `localStorage` du navigateur — il persiste après fermeture/réouverture,
  sans aucun serveur ni compte.
- **Carte** : affichage des écoles classées sur une carte OpenStreetMap.
  Comme l'adresse exacte des écoles n'est pas disponible, la localisation se
  fait au niveau de la commune (via l'API de géocodage Nominatim/OSM,
  gratuite). Les résultats sont mis en cache localement pour éviter de
  refaire les requêtes.
- **Export Excel** : génère un fichier `.xlsx` avec le classement (Rang,
  École, Commune, RNE circo, Circonscription, Niveau), prêt à être renvoyé
  dans votre dossier de mobilité.

Les données des écoles proviennent du fichier `data/schools.json`, généré à
partir de votre fichier `AMPHI_M2_EXT_100.xlsx`.

## Lancer l'application en local

Prérequis : [Node.js](https://nodejs.org/) 18 ou plus récent.

```bash
npm install
npm run dev
```

Puis ouvrez [http://localhost:3000](http://localhost:3000).

## Générer une version statique (à héberger n'importe où)

```bash
npm run build
```

Le résultat est généré dans le dossier `out/` : un site 100% statique
(HTML/CSS/JS) que vous pouvez héberger gratuitement sur Vercel, Netlify,
GitHub Pages, ou simplement ouvrir/servir en local — aucun serveur Node
n'est nécessaire une fois construit.

Pour prévisualiser la version statique en local :

```bash
npx serve out
```

## Mettre à jour la liste des écoles

Éditez `data/schools.json` (tableau d'objets avec les champs `id`, `ecole`,
`commune`, `rne`, `circo`, `niveau`) ou remplacez-le par un export généré
depuis votre fichier Excel d'origine.

## Notes

- Aucune donnée n'est envoyée à un serveur, à l'exception des requêtes de
  géocodage des communes (nécessaires uniquement pour l'onglet Carte),
  envoyées à l'API publique d'OpenStreetMap (Nominatim).
- Le classement étant stocké dans le `localStorage` du navigateur, il est
  propre à cet appareil et à ce navigateur (pas de synchronisation entre
  appareils).
