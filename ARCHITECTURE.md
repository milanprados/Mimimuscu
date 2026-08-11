# Architecture V34

## Vue générale

```text
data/*.json
   │
   ▼
js/core/catalog.js
   │
   ├── js/core/program.js ─────────► js/core/workout-engine.js
   │                                      │
   │                                      ▼
   │                                js/ui/workout.js
   │
   ├── js/core/progression.js ─────► js/ui/profile.js
   │                              └► js/ui/progress.js
   │
   └── js/core/calendar.js ────────► js/ui/calendar.js

js/app.js assemble les modules et déclenche le refresh global.

styles.css   → structure et composants partagés
theme.css    → palette éditoriale claire et pages principales
workout.css  → mode séance, minuteurs et écran de repos
```

## Dossiers

### `data/`

Source de vérité du contenu. Une personne peut modifier le programme ou une fiche
d'exercice sans toucher au moteur.

### `js/core/`

Logique métier. On essaie de garder ce dossier sans DOM pour pouvoir le tester.

### `js/ui/`

Affichage, boutons, modales et génération HTML.

Le CSS n'est jamais injecté depuis JavaScript. Les écrans génèrent directement
leur markup final : il n'y a pas de couche de présentation qui réorganise le DOM
après rendu.

### `js/utils/`

Dates locales, DOM, sauvegarde et preload.

## Flux d'une séance

1. `createProgramSession()` lit la séance actuelle.
2. `WorkoutEngine.start()` construit le plan.
3. Le moteur appelle un hook : `countdown`, `exercise`, `timer`, `rest`.
4. `ui/workout.js` affiche l'étape correspondante.
5. À la fin d'un exercice, le moteur ajoute la série au log.
6. À la fin de la séance :
   - adaptation des cibles ;
   - records personnels ;
   - XP / streak ;
   - avancement du cycle si c'est une séance programme ;
   - historique.
7. L'événement `mimi:refresh` met à jour accueil, profil, progrès et calendrier.

## Différence importante : activité vs programme

V31 distingue :

- `counted` : activité quotidienne, utilisée pour le streak et les stats ;
- `programCompleted` : séance officielle du cycle terminée.

Donc une séance personnalisée le matin puis la séance programme le soir :
la journée n'est pas comptée deux fois, mais le cycle avance bien.

## Bugs historiques supprimés pendant le refactor

- chemins d'assets fragiles sous GitHub Pages ;
- un dossier `js/vXX` par version ;
- étapes d'exercice sans `kind: "exercise"` ;
- séries pouvant ne pas être enregistrées ;
- phases échauffement / retour au calme écrasées ;
- brouillon planner écrit en `exercises[]` mais lu en `ids[]` ;
- repos de 0 seconde transformé en étape ;
- calcul du jour via UTC ;
- séance perso pouvant bloquer l'avancement du programme ;
- séance perso pouvant tromper le calendrier ;
- timer reconstruit au moment de reprendre après pause ;
- nouvel `AudioContext` créé à chaque bip.

## Ajouter un écran

1. Ajouter le `<section>` dans `index.html`.
2. Créer `js/ui/<nom>.js`.
3. Exporter une fonction `create...View()`.
4. L'initialiser dans `js/app.js`.
5. Ajouter son `render()` à `refreshApp()` si l'écran dépend de l'état.
6. Ajouter un test de contrat DOM si beaucoup d'IDs sont utilisés.

## Cache PWA

`sw.js` utilise :

- **network-first** pour la navigation HTML ;
- **network-first** pour JS, CSS et JSON ;
- **cache-first** pour les images et autres assets statiques.

Le numéro de version du cache est mis à jour à chaque livraison. Le service
worker supprime alors les caches applicatifs obsolètes sans toucher au
`localStorage`.
