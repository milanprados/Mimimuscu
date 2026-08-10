Mimi Muscu V16 — rebuild from scratch

Architecture:
- index.html: markup only
- styles.css: design system + workout focus UI
- data.js: exercises + programs
- state.js: persistence/migration
- engine.js: workout state machine
- app.js: render/bindings
- sw.js: PWA caching

UI principles:
- 4 primary tabs only: Séance / Exos / Progrès / Profil
- workout focus mode is full-screen, minimal and hands-free
- recovery shows next exercise and its cues
- exercise dictionary uses the same exercise data as workout mode
- visual assets are centralized in data.js, so replacing all exercise images later is one operation

V17:
- session preview/planner before workout
- full ordered exercise list with targets and rest times
- reorder exercises
- delete exercises
- add exercises from library
- tap an exercise to replace it
- custom session draft persists until the session is completed or reset
- quick-start remains available

V18:
- saved custom workout library
- build custom workouts from scratch
- reorder/delete/replace exercises
- per-exercise rest duration
- import/export .json workout files
- stable mimi-muscu workout JSON schema v1
- custom sessions can be launched directly
- intended workflow: send ChatGPT a workout URL -> receive compatible JSON -> import into app

V19 — product pass:
- redesigned dashboard/home
- selectable smart session duration: 10 / 15 / 22 / 30 min
- adaptive progression engine based on completion + perceived effort
- milestone goals
- periodic benchmark/test session
- body measurements and lightweight trend visualization
- end-of-workout muscle load + coach analysis
- richer workout JSON schema v2 (sets, target override, tempo, notes)
- import remains backward-compatible with v1
- daily coach recommendation
- dashboard prioritizes today's workout and minimizes navigation

V20 — Exercise catalog refactor
- exercises.json is now the source of truth
- 100 curated/common bodyweight exercises
- each exercise has: id, aliases, category, movement pattern, difficulty, mode, prescription, quiet/impact/equipment constraints, muscles, coaching, progression/regression, visual asset key
- data.js loads exercises.json with top-level await and normalizes it for the rest of the app
- workout programs contain only exercise IDs
- adding a future exercise does not require editing the workout engine
- dictionary defaults to silent + no-equipment filters for this user's use case
- noisy/high-impact and minimal-equipment movements can remain in the global catalog without being proposed by default
