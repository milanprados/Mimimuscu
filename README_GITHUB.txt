Mimi Muscu — GitHub Pages build

Cette version est prête à être déposée à la racine d’un dépôt GitHub Pages.

Déploiement :
1. Crée un dépôt public GitHub, par exemple "mimi-muscu".
2. Dézippe cette archive.
3. Envoie TOUS les fichiers à la racine du dépôt (index.html doit être à la racine).
4. GitHub → Settings → Pages.
5. Source : "Deploy from a branch".
6. Branche : main.
7. Dossier : / (root).
8. Save.

L’app sera disponible à une adresse du type :
https://TON-PSEUDO.github.io/mimi-muscu/

Important :
- Tous les chemins locaux sont relatifs.
- Le manifest utilise start_url "./" et scope "./".
- Le service worker fonctionne dans un sous-dossier GitHub Pages sans connaître le nom du dépôt.
- Le cache PWA est versionné "mimi-muscu-v20-github".
- Le catalogue exercises.json contient 100 exercices.
- Le format d’import/export de séances utilise désormais app: "mimi-muscu".
