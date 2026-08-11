/**
 * Moteur de séance.
 *
 * Il ne manipule jamais le DOM. L'interface lui fournit des hooks.
 * Cela rend la logique testable sans navigateur.
 */
import {PROGRESSION} from "../config.js";
import {localDayKey, previousDayKey} from "../utils/dates.js";

export class WorkoutEngine {
  constructor({
    state,
    exercises,
    buildProgramPlan,
    buildSessionPlan,
    hooks = {},
    persist,
    now = () => new Date()
  }) {
    this.state = state;
    this.exercises = exercises;
    this.buildProgramPlan = buildProgramPlan;
    this.buildSessionPlan = buildSessionPlan;
    this.hooks = hooks;
    this.persist = persist;
    this.now = now;

    this.runToken = 0;
    this.resetRuntime();
  }

  resetRuntime() {
    this.planItems = [];
    this.planMeta = {};
    this.currentIndex = -1;

    this.timer = null;
    this.remainingSeconds = 0;
    this.timerRunning = false;

    this.log = [];
    this.startedAtMs = null;

    this.currentReps = 0;
    this.currentEffort = "good";

    this.redo = false;
    this.advancesProgram = true;
  }

  cancel() {
    this.runToken++;
    this.stopTimer();
    this.resetRuntime();
  }

  start({redo = false, session = null} = {}) {
    this.cancel();

    this.redo = redo;

    const plan = session
      ? this.buildSessionPlan(session)
      : this.buildProgramPlan(this.state.program, this.state.sessionDraft);

    this.planItems = plan.items;
    this.planMeta = plan.meta;
    this.advancesProgram = plan.meta.type === "program";

    this.currentIndex = 0;
    this.startedAtMs = Date.now();

    const token = ++this.runToken;
    this.showCountdown(token);
  }

  get currentItem() {
    return this.planItems[this.currentIndex] || null;
  }

  get currentExercise() {
    const item = this.currentItem;
    return item?.kind === "exercise" ? this.exercises[item.id] : null;
  }

  getTarget(exerciseId, item = this.currentItem) {
    const exercise = this.exercises[exerciseId];
    if (!exercise) return 0;

    const explicit =
      item?.targetOverride
      ?? item?.repsOverride
      ?? item?.durationOverride;

    if (explicit != null) return Math.max(1, Math.round(explicit));

    const base = Number(this.state.targets[exerciseId]) || exercise.base;
    const scale = Number(item?.targetScale) || 1;

    if (scale === 1) return base;

    const scaled = Math.round(base * scale);
    const lowerBound = exercise.mode === "time"
      ? 10
      : Math.min(exercise.min || 1, base);

    return Math.max(lowerBound, scaled);
  }

  findNextExercise(fromIndex = this.currentIndex + 1) {
    for (let index = fromIndex; index < this.planItems.length; index++) {
      if (this.planItems[index].kind === "exercise") {
        return this.planItems[index];
      }
    }
    return null;
  }

  showCountdown(token = this.runToken) {
    const item = this.currentItem;

    if (!item) {
      this.finish();
      return;
    }

    if (item.kind === "rest") {
      this.enterCurrentItem();
      return;
    }

    this.hooks.countdown?.({
      item,
      exercise: this.exercises[item.id],
      done: () => {
        if (token !== this.runToken) return;
        this.enterCurrentItem();
      }
    });
  }

  enterCurrentItem() {
    const item = this.currentItem;

    if (!item) {
      this.finish();
      return;
    }

    if (item.kind === "rest") {
      this.startRest(item);
      return;
    }

    const exercise = this.exercises[item.id];
    const target = this.getTarget(item.id, item);
    const effectiveMode = item.modeOverride || exercise.mode;

    this.remainingSeconds = target;
    this.currentReps = target;
    this.currentEffort = "good";

    if (effectiveMode === "time") {
      this.startTimedExercise(item, exercise, target);
      return;
    }

    this.hooks.exercise?.({
      item,
      exercise,
      target,
      next: this.findNextExercise()
    });
  }

  startTimedExercise(item, exercise, target) {
    this.hooks.timer?.({
      item,
      exercise,
      target,
      next: this.findNextExercise()
    });

    this.runTimedInterval();
  }

  runTimedInterval() {
    this.startTimerInterval(() => {
      this.remainingSeconds--;
      this.hooks.tick?.(this.remainingSeconds);

      if (this.remainingSeconds <= 0) {
        this.stopTimer();
        this.completeCurrentExercise();
      }
    });
  }

  startRest(item) {
    this.remainingSeconds = Math.max(0, Number(item.seconds) || 0);

    const next = this.findNextExercise(this.currentIndex + 1);

    this.hooks.rest?.({
      seconds: this.remainingSeconds,
      next,
      nextExercise: next ? this.exercises[next.id] : null
    });

    if (this.remainingSeconds <= 0) {
      this.advanceAfterRest();
      return;
    }

    this.runRestInterval();
  }

  runRestInterval() {
    this.startTimerInterval(() => {
      this.remainingSeconds--;
      this.hooks.tick?.(this.remainingSeconds);

      if (this.remainingSeconds <= 0) {
        this.stopTimer();
        this.advanceAfterRest();
      }
    });
  }

  startTimerInterval(callback) {
    this.stopTimer();
    this.timerRunning = true;
    this.timer = setInterval(callback, 1000);
  }

  stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.timerRunning = false;
  }

  togglePause() {
    const item = this.currentItem;
    const exercise = this.currentExercise;
    const effectiveMode = item?.modeOverride || exercise?.mode;

    if (!exercise || effectiveMode !== "time") return;

    if (this.timerRunning) {
      this.stopTimer();
      this.hooks.paused?.(true);
      return;
    }

    this.hooks.paused?.(false);
    this.runTimedInterval();
  }

  /**
   * Met en pause le minuteur courant pendant l'ouverture d'un guide.
   * Retourne true uniquement si le moteur tournait réellement : l'UI sait
   * ainsi si elle doit reprendre automatiquement à la fermeture du guide.
   */
  pauseForGuide() {
    if (!this.timerRunning) return false;
    this.stopTimer();

    if (this.currentItem?.kind === "exercise") {
      this.hooks.paused?.(true);
    }

    return true;
  }

  resumeAfterGuide() {
    if (this.timerRunning || this.remainingSeconds <= 0) return;

    const item = this.currentItem;
    if (!item) return;

    if (item.kind === "rest") {
      this.runRestInterval();
      return;
    }

    const exercise = this.currentExercise;
    const effectiveMode = item.modeOverride || exercise?.mode;
    if (exercise && effectiveMode === "time") {
      this.hooks.paused?.(false);
      this.runTimedInterval();
    }
  }

  completeRepetitionExercise(reps, effort) {
    this.currentReps = Math.max(0, Number(reps) || 0);
    this.currentEffort = effort || "good";
    this.completeCurrentExercise();
  }

  completeCurrentExercise(early = false) {
    this.recordCurrentExercise({early});
    this.advance();
  }

  skipCurrentExercise() {
    const item = this.currentItem;

    if (item?.kind === "exercise" && item.track !== false) {
      const exercise = this.exercises[item.id];

      this.log.push({
        id: item.id,
        name: exercise.name,
        mode: item.modeOverride || exercise.mode,
        target: this.getTarget(item.id, item),
        actual: null,
        effort: "skipped",
        skipped: true,
        adaptive: item.adaptive !== false,
        phase: item.phase || "Bloc principal"
      });
    }

    this.advance();
  }

  skipRest() {
    if (this.currentItem?.kind !== "rest") return;
    this.stopTimer();
    this.advanceAfterRest();
  }

  recordCurrentExercise({early = false} = {}) {
    const item = this.currentItem;

    if (!item || item.kind !== "exercise" || item.track === false) return;

    const exercise = this.exercises[item.id];
    const effectiveMode = item.modeOverride || exercise.mode;
    const target = this.getTarget(item.id, item);

    const actual = effectiveMode === "reps"
      ? this.currentReps
      : (
        this.remainingSeconds <= 0
          ? target
          : Math.max(0, target - this.remainingSeconds)
      );

    this.log.push({
      id: item.id,
      name: exercise.name,
      mode: effectiveMode,
      target,
      actual,
      effort: this.currentEffort,
      skipped: false,
      early,
      adaptive: item.adaptive !== false,
      phase: item.phase || "Bloc principal"
    });
  }

  advance() {
    this.stopTimer();
    this.currentIndex++;

    if (this.currentIndex >= this.planItems.length) {
      this.finish();
      return;
    }

    this.enterCurrentItem();
  }

  advanceAfterRest() {
    this.currentIndex++;

    if (this.currentIndex >= this.planItems.length) {
      this.finish();
      return;
    }

    // Le compte à rebours 3-2-1 est inclus dans les trois dernières secondes
    // du repos. À 0, le mouvement suivant commence donc immédiatement.
    this.enterCurrentItem();
  }

  adaptTargets() {
    const grouped = {};

    for (const set of this.log) {
      if (set.skipped || set.adaptive === false) continue;
      (grouped[set.id] ||= []).push(set);
    }

    for (const [exerciseId, sets] of Object.entries(grouped)) {
      const exercise = this.exercises[exerciseId];
      const current = Number(this.state.targets[exerciseId]) || exercise.base;

      const ratios = sets.map(set => set.actual / set.target);
      const average = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;

      const easy = sets.filter(set => set.effort === "easy").length;
      const hard = sets.filter(set => set.effort === "hard").length;
      const full = sets.filter(set => set.actual >= set.target).length;

      let next = current;

      if (exercise.mode === "reps") {
        if (average >= 1.08 && easy >= Math.ceil(sets.length / 2)) {
          next += exercise.step * 2;
        } else if (average >= 0.96 && full >= sets.length - 1 && hard === 0) {
          next += exercise.step;
        } else if (average < 0.72 || hard === sets.length) {
          next -= exercise.step;
        }
      } else {
        if (average >= 1 && hard === 0) next += exercise.step;
        else if (average < 0.75) next -= exercise.step;
      }

      this.state.targets[exerciseId] = Math.max(
        exercise.min,
        Math.min(exercise.max, next)
      );
    }
  }

  finish() {
    this.stopTimer();

    const today = localDayKey(this.now());

    const alreadyCountedToday = this.state.history
      .some(record => record.day === today && record.counted);

    const programAlreadyCompletedToday = this.state.history
      .some(record =>
        record.day === today
        && (
          record.programCompleted === true
          || (record.counted && record.sessionType === "program")
        )
      );

    // `counted` pilote streak/séances/jour : au maximum une fois par jour.
    const counted = !alreadyCountedToday && !this.redo;

    // La validation du programme est indépendante : une séance perso faite avant
    // ne doit pas bloquer la vraie séance du cycle.
    const programCompleted =
      this.advancesProgram
      && !this.redo
      && !programAlreadyCompletedToday;

    this.state.attempts++;
    const previousBests = {...this.state.bests};

    if (counted || programCompleted) {
      this.adaptTargets();
    }

    if (counted) {
      this.state.sessions++;
    }

    if (programCompleted) {
      this.state.program.index++;
      this.state.sessionDraft = null;
    }

    const validSets = this.log.filter(set => !set.skipped);
    const newRecords = [];

    for (const set of validSets) {
      if (set.actual > (previousBests[set.id] || 0)) newRecords.push(set);

      this.state.bests[set.id] = Math.max(
        this.state.bests[set.id] || 0,
        set.actual
      );
    }

    const completionRatio = validSets.length
      ? validSets.filter(set => set.actual >= set.target).length / validSets.length
      : 0;

    const score = Math.round(completionRatio * 100);

    let xp = Math.round(70 + completionRatio * 50 + (counted ? 25 : 0));
    if (this.redo) xp = Math.round(xp * 0.45);
    this.state.xp += xp;

    if (counted) {
      const yesterday = previousDayKey(this.now());

      this.state.streak = this.state.lastDay === yesterday
        ? this.state.streak + 1
        : (this.state.lastDay === today ? this.state.streak : 1);

      this.state.lastDay = today;
    }

    const duration = Math.max(
      1,
      Math.round((Date.now() - this.startedAtMs) / 1000)
    );

    const record = {
      date: this.now().toISOString(),
      day: today,
      counted,
      programCompleted,
      redo: this.redo,
      xp,
      score,
      duration,

      sessionName: this.planMeta.name || "Séance",
      sessionKey: this.planMeta.key || "",
      sessionType: this.planMeta.type || "custom",

      sets: this.log
    };

    this.state.history.unshift(record);
    this.state.history = this.state.history.slice(0, PROGRESSION.historyLimit);

    this.persist(this.state);

    this.hooks.finished?.({
      xp,
      score,
      records: newRecords,
      duration,
      record
    });
  }
}
