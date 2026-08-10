# Mimi Muscu V27 — UI Reboot

## Bug corrigé
La fiche exercice est désormais une vraie couche plein écran au-dessus de la navigation.
Tout changement d'onglet ferme systématiquement les couches transitoires via `closeAllLayers()`.

## Refonte
- nouveau shell graphique
- navigation basse flottante
- accueil réorganisé
- bibliothèque exercices refaite
- fiche exercice entièrement redessinée
- progrès et profil séparés plus clairement
- mode séance refait
- planner et éditeurs harmonisés
- CSS réécrit depuis zéro
- HTML réécrit depuis zéro (suppression des restes de versions précédentes)
- nouveau namespace JS `js/v27/`
- cache service worker `mimi-muscu-v27`

## Tests statiques
- sélecteurs JS / IDs HTML : OK
- syntaxe JS : OK
- catalogue / programmes : OK
- tests séances : OK

- contrat UI modal/navigation : OK
- barre de progression séance dynamique : OK

Note : l’environnement bloque administrativement la navigation Chromium vers localhost/file://,
donc le test navigateur automatisé complet ne peut pas s’exécuter ici. Les contrats DOM,
sélecteurs, syntaxe et logique de fermeture des couches sont testés automatiquement.
