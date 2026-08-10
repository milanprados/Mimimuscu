# Mimi Muscu V30 — Calendrier

## Accueil
- date du jour
- état : prévu / fait / repos
- mini semaine L→D
- trois prochains jours
- raccourci vers le calendrier complet

## Calendrier complet
- navigation mois précédent / suivant
- grille mensuelle
- aujourd'hui mis en évidence
- séances terminées
- séances prévues
- jours de repos
- détail d'un jour sélectionné
- agenda des 10 prochains jours
- lancement de la séance depuis aujourd'hui
- jour de repos configurable

## Planning glissant
Le calendrier futur part toujours de `state.program.index`.
Si une journée est ratée, aucune séance n'est perdue : le programme courant
est simplement replanifié au prochain jour d'entraînement.
Les séances déjà réalisées restent affichées à leur date réelle grâce à l'historique.

## QA
- calcul Monday→Saturday + repos Sunday : OK
- décalage après séance déjà faite aujourd'hui : OK
- grille mensuelle 42 cases : OK
- syntaxe JS : OK
- IDs DOM : OK
- catalogue/programmes : OK
