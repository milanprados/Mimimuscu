# Mimi Muscu V23 — Full stabilization audit

## Root cause
Le runtime live V22 utilisait encore `tpl.ids.map(...)` alors que le template issu de `programs.json`
ne garantissait pas `ids`. Le crash correspond exactement à :
`Cannot read properties of undefined (reading 'map')`.

## Strategy V23
- Nouveau namespace JS complet : `js/v23/`
- Aucun module V22 n'est réutilisé par le navigateur.
- `workoutTemplate()` expose toujours `ids[]`, compilé depuis `blocks`.
- Tous les tableaux issus du state/data sont normalisés avant `.map()`.
- Les anciennes séances personnalisées `blocks` sont converties vers `exercises`.
- Boot diagnostic : `window.__MIMI_BOOT__.step`.
- L'écran d'erreur affiche l'étape exacte si un futur boot plante.

## Audits exécutés
- 100 exercices : OK
- références programmes : OK
- circuits / supersets : OK
- benchmark : OK
- syntaxe de tous les modules V23 : OK
- selectors statiques HTML/JS : OK
- IDs statiques manquants : []
- programmes compilables en liste d'exercices : OK

## Cache
Le service worker utilise maintenant `mimi-muscu-v23`.
L'entrée HTML importe `./js/v23/app.js?v=23.0`.
Cela empêche Safari d'exécuter par accident un ancien module V22.
