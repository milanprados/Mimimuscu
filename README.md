# Mimi Muscu

PWA de musculation au poids du corps : routine full body ~20 min, 6 jours/semaine,
progression adaptative, calendrier, profil, bibliothèque d'exercices et mode hors-ligne.

## Patch V31.1 — déroulement des séances

- correction du crash qui pouvait faire disparaître les repos ;
- fin des exercices chronométrés → transition automatique ;
- compte à rebours 3–2–1 inclus dans les dernières secondes du repos ;
- aperçu du prochain exercice pendant le repos ;
- guide technique accessible pendant l'exercice et le repos ;
- ouverture du guide = pause du minuteur courant, puis reprise au retour.

## Démarrage rapide

Il n'y a **aucun build obligatoire** et aucune dépendance runtime.

```bash
npm run check
```

Pour tester en local, sers le dossier avec un serveur HTTP
(par exemple `python3 -m http.server`). Les modules ES et le service worker
ne doivent pas être testés via `file://`.

## Où modifier quoi ?

| Je veux…                                  | Fichier                             |
| ----------------------------------------- | ----------------------------------- |
| changer les 24 séances                    | `data/programs.json`                |
| modifier/ajouter un exercice              | `data/exercises.json`               |
| ranger les variantes                      | `data/exercise_families.json`       |
| modifier les milestones                   | `data/milestones.json`              |
| changer XP / longueur du cycle / stockage | `js/config.js`                      |
| changer la progression automatique        | `js/core/workout-engine.js`         |
| changer le calcul des indices             | `js/core/progression.js`            |
| changer le planning futur                 | `js/core/calendar.js`               |
| modifier l'accueil                        | `js/ui/home.js`                     |
| modifier la bibliothèque                  | `js/ui/exercise-library.js`         |
| modifier le mode séance                   | `js/ui/workout.js`                  |
| modifier le planner                       | `js/ui/session-planner.js`          |
| modifier le profil                        | `js/ui/profile.js`                  |
| modifier l'onglet Progrès                 | `js/ui/progress.js`                 |
| modifier le calendrier                    | `js/ui/calendar.js`                 |
| modifier la structure visuelle commune    | `styles.css`                        |
| modifier la DA des pages                  | `theme.css`                         |
| modifier une séance, un timer ou le repos | `workout.css` et `js/ui/workout.js` |

Pour comprendre les flux, lis [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Principes V34

- une seule version active du code ;
- les JSON contiennent le contenu éditable ;
- `core/` contient les règles du produit ;
- `ui/` contient le DOM et les interactions ;
- `utils/` contient les petites primitives réutilisables ;
- `app.js` assemble les modules mais ne contient presque pas de logique métier ;
- noms de fonctions explicites ;
- commentaires seulement là où ils expliquent un choix ou un piège ;
- tests des chemins critiques avant déploiement.
- aucun CSS injecté depuis JavaScript ;
- aucun observateur chargé de réorganiser un écran après son rendu ;
- le numéro de livraison est `34.1` dans `index.html`, `js/config.js`,
  les imports iOS sensibles de `js/app.js` et `sw.js`.
