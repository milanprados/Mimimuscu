# Mimi Muscu V21 — QA checklist

Cette version a été refactorisée pour supprimer le gros `app.js` monolithique.

## Modules
- `js/app.js` : démarrage / orchestration uniquement
- `js/ui/workout-ui.js` : écran séance, timer, repos, countdown
- `js/ui/dashboard.js` : accueil, durées, programme, milestones
- `js/ui/dictionary.js` : catalogue et fiches d'exercices
- `js/ui/sessions.js` : séances personnalisées, planner, picker, import/export
- `js/ui/profile-progress.js` : profil, mesures, progrès
- `js/helpers.js` : navigation modales / bindings sûrs
- `engine.js` : moteur de séance
- `state.js` : stockage
- `data.js` + `exercises.json` : données

## Bug principal V20 identifié
Une liaison `$("#sessionHero").onclick = ...` ciblait un élément supprimé du HTML.
Cela provoquait une exception JavaScript au démarrage et empêchait tous les bindings situés après cette ligne de s'installer.
Conséquence : boutons 10/15/22/30 min, retours de certaines modales et plusieurs contrôles paraissaient morts.

V21 utilise des bindings sûrs et aucun élément optionnel ne peut stopper tout le démarrage de l'app.

## Interactions testées
- Onglets Accueil / Exos / Progrès / Profil
- 10 / 15 / 22 / 30 min
- GO
- Voir & modifier
- Retour planner
- Picker : retour vers planner / éditeur
- Nouvelle séance
- Éditeur : ajouter / remplacer / monter / descendre / supprimer
- Fermer éditeur
- Format JSON + retour
- Fiche exercice + retour
- Milestones + retour
- Ajouter mesure + retour
- Profil / préférences
- Filtres dico
- Démarrage séance / countdown
- Timer / pause / terminer / passer
- Repos / passer repos
- Exercice reps / +/- / difficulté / fini / passer
- Quitter séance

## Corrections supplémentaires
- Les séances personnalisées et le benchmark n'avancent plus par erreur la rotation A → B → C du programme principal.
- Le bouton « Voir & modifier » n'est bindé qu'une seule fois.
- Les fermetures de sous-modales conservent correctement le verrouillage de page quand une modale parente reste ouverte.

## Tests automatiques effectués
- Vérification syntaxique Node de tous les modules.
- Vérification que tous les IDs statiques utilisés par les bindings existent dans `index.html`.
- Vérification qu'aucun binding `.onclick` direct fragile ne reste dans les modules.
- Vérification qu'un exercice de programme est toujours suivi d'un repos et inversement.
- Vérification des repos personnalisés importés.
- Vérification que les séances personnalisées n'avancent pas la rotation A/B/C.
- Vérification qu'une séance issue du programme avance bien la rotation.

Le navigateur Chromium de l'environnement de test bloque administrativement les connexions localhost, donc le test navigateur automatisé complet n'est pas disponible ici ; les tests de logique et de structure ci-dessus ont été exécutés à la place.
