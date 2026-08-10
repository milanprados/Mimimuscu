Mimi Muscu V22 — Foundation

Cette version est prête pour GitHub Pages.

Architecture :
- data/exercises.json : catalogue d’exercices
- data/programs.json : programmes Débutant / Intermédiaire / Avancé
- data/milestones.json : objectifs
- data/benchmarks.json : tests périodiques
- data/schema/ : schémas des formats
- js/core/ : moteur, données, stockage, migrations
- js/ui/ : écrans et interactions
- js/utils/ : sauvegarde + préchargement
- tools/validate-data.mjs : validation du catalogue/programmes
- tests/run-tests.mjs : tests du compilateur de séances
- sw.js : cache PWA par stratégie

Nouveautés :
- sauvegarde complète export/import
- migrations versionnées
- workout JSON v3 avec exercise/circuit/superset
- programmes externalisés
- validation automatique des références
- tests automatisés
- préchargement du prochain exercice
- cache app/data/images séparé
- notification de nouvelle version

Tests locaux (facultatif) :
npm run check

Déploiement GitHub Pages :
remplace le contenu du repo par le contenu de ce ZIP.
URL inchangée.
