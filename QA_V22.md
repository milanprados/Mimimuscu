# Mimi Muscu V22 — Foundation QA

## Validations exécutées
- `node tools/validate-data.mjs` → OK — OK — 100 exercices, programmes/milestones/benchmarks valides.
- `node tests/run-tests.mjs` → OK — OK — tests de compilation programmes / circuits / supersets / benchmark.
- Syntaxe JavaScript → OK sur 14 fichiers.

## Architecture
- Les programmes, milestones et benchmarks ne sont plus codés dans JavaScript.
- Le catalogue et tous les contenus sportifs vivent dans `data/`.
- `state.js` applique une chaîne de migrations jusqu’à V22.
- Les fichiers de sauvegarde complète sont indépendants du code de l’app.
- Le moteur reçoit une séance compilée ; le format source peut être `exercise`, `circuit` ou `superset`.

## PWA
- App shell : network-first avec fallback cache.
- JSON data : network-first.
- Images : cache-first.
- Préchargement de l’exercice suivant.
- Message de mise à jour quand un nouveau service worker est détecté.

## Limite actuelle
Les illustrations restent encore distantes via free-exercise-db. L’architecture est prête pour les remplacer par `assets/exercises/*.webp` sans toucher au moteur.
