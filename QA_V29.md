# Mimi Muscu V29 — Profil & progression

## Profil
- fiche athlète
- niveau + XP vers le prochain niveau
- titre selon la régularité globale
- indice physique personnel (100 = niveau de départ)
- axes Push / Jambes / Core / Dos
- cycle 24 séances + mini timeline
- calendrier d'activité 42 jours
- records personnels
- avant / maintenant
- objectifs personnels
- mensurations
- réglages et sauvegarde relégués en bas

## Progression
- 6 métriques globales
- indices personnels détaillés
- comparaison depuis le début
- objectifs adaptatifs vs records
- poids
- historique

## Principe des indices
Aucun percentile populationnel.
Chaque axe part à 100 et compare les performances actuelles aux premières performances
disponibles sur des mouvements repères. Régularité = jours actifs sur l'objectif de
24 séances / 28 jours.

## Données
- migration état V29
- progression de départ figée dans `progressBaseline`
- objectifs personnels stockés dans `goals`
- pseudo/date de départ dans `profileMeta`

## QA
- syntaxe JS : OK
- IDs DOM / modules : OK
- catalogue/programmes : OK
- contrat V29 : OK
