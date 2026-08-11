/**
 * Accueil : résumé du programme + milestones.
 * Le mini-calendrier est rendu séparément par ui/calendar.js.
 */
import {$, on, openLayer, closeLayer} from "../utils/dom.js";
import {PROGRAM} from "../config.js";
import {isRestDay, localDayKey} from "../utils/dates.js";
import {isProgramHistoryRecord} from "../core/progression.js";

export function createHomeView({
  state,
  milestones,
  getProgramTemplate,
  createProgramSession,
  launchSession,
  openPlanner
}) {
  const recentCountedSessions = (count = 3) =>
    state.history.filter(record => record.counted).slice(0, count);

  function coachRecommendation(template) {
    if (template.intensity === "léger") {
      return "Journée volontairement plus légère : technique propre, respiration et récupération active.";
    }

    const recent = recentCountedSessions();

    if (!recent.length) {
      return "Première semaine : garde 1–3 répétitions en réserve et apprends les mouvements proprement.";
    }

    const sets = recent.flatMap(record => record.sets || []);
    const hardSets = sets.filter(set => set.effort === "hard" && !set.skipped).length;
    const trackedSets = sets.filter(set => !set.skipped).length || 1;

    if (hardSets / trackedSets > 0.45) {
      return "Tu as beaucoup forcé récemment : ne cherche pas l’échec aujourd’hui, garde une exécution propre.";
    }

    const averageScore = recent.reduce((sum, record) => sum + (record.score || 0), 0) / recent.length;

    if (averageScore >= 92) {
      return "Bonne progression : les objectifs s’ajustent automatiquement sur les journées de progression.";
    }

    return "Reste régulier : 20 minutes propres valent mieux qu’une séance trop dure que tu ne récupères pas.";
  }

  function milestoneProgress(milestone) {
    const best = state.bests[milestone.exerciseId] || 0;
    return Math.max(0, Math.min(100, Math.round(best / milestone.value * 100)));
  }

  function renderMilestones() {
    $("#milestonePreview").innerHTML = milestones.slice(0, 3).map(milestone => {
      const progress = milestoneProgress(milestone);
      const best = state.bests[milestone.exerciseId] || 0;

      return `
        <div class="milestone">
          <div class="milestone-top">
            <strong>${milestone.label}</strong>
            <span>${best}/${milestone.value}</span>
          </div>
          <div class="milestone-bar"><div style="width:${progress}%"></div></div>
        </div>`;
    }).join("");

    $("#milestoneList").innerHTML = milestones.map(milestone => {
      const progress = milestoneProgress(milestone);
      const best = state.bests[milestone.exerciseId] || 0;

      return `
        <div class="card">
          <div class="milestone-top">
            <strong>${milestone.label}</strong>
            <span>${progress}%</span>
          </div>
          <div class="milestone-bar"><div style="width:${progress}%"></div></div>
          <p class="muted">${best} / ${milestone.value}</p>
        </div>`;
    }).join("");
  }

  function render() {
    const template = getProgramTemplate(state.program);
    const position = Number(state.program.index) % PROGRAM.cycleLength;
    const cycle = Math.floor(Number(state.program.index) / PROGRAM.cycleLength) + 1;
    const todayKey = localDayKey();
    const programDoneToday = state.history.find(record =>
      record.day === todayKey
      && isProgramHistoryRecord(record)
      && (record.programCompleted === true || record.counted)
    );
    const restToday = isRestDay(new Date(), state.calendarPrefs?.restDay ?? PROGRAM.defaultRestDay);

    const quickStart = $("#quickStart");
    const prepare = $("#prepareSession");
    const phaseRoute = document.querySelector(".phase-route");

    // L'accueil ne doit jamais présenter la séance suivante comme étant "aujourd'hui"
    // une fois la séance officielle validée, ni proposer un programme un jour de repos.
    const blockedForToday = Boolean(programDoneToday || restToday);
    quickStart?.classList.toggle("hidden", blockedForToday);
    prepare?.classList.toggle("hidden", blockedForToday);
    phaseRoute?.classList.toggle("hidden", blockedForToday);

    if (programDoneToday) {
      $("#sessionLabel").textContent = programDoneToday.sessionName || "Séance du jour";
      $("#sessionName").textContent = "Séance terminée ✓";
      $("#sessionFocus").textContent = `Prochaine séance : ${template.name}`;
      $("#dashDuration").textContent = `${Math.max(1, Math.round((programDoneToday.duration || 0) / 60))} min`;
      $("#dailyCoachText").textContent = "C’est fait pour aujourd’hui. Récupère, la prochaine séance reste prête pour le prochain jour d’entraînement.";
      $("#readiness").textContent = "FAIT";
      $("#readiness").classList.add("light-day");
    } else if (restToday) {
      $("#sessionLabel").textContent = "Jour de récupération";
      $("#sessionName").textContent = "Repos";
      $("#sessionFocus").textContent = `Prochaine séance : ${template.name}`;
      $("#dashDuration").textContent = "—";
      $("#dailyCoachText").textContent = "Repos prévu aujourd’hui. Marche ou mobilité légère si tu en as envie, mais rien n’est à rattraper.";
      $("#readiness").textContent = "REPOS";
      $("#readiness").classList.add("light-day");
    } else {
      $("#sessionLabel").textContent = `Semaine ${template.week} • Jour ${template.day}/6`;
      $("#sessionName").textContent = template.name;
      $("#sessionFocus").textContent = template.focus;
      $("#dashDuration").textContent = "~20 min";
      $("#dailyCoachText").textContent = coachRecommendation(template);
      $("#readiness").textContent = template.intensity === "léger" ? "LÉGER" : "PROGRESSION";
      $("#readiness").classList.toggle("light-day", template.intensity === "léger");
    }

    $("#cycleLabel").textContent =
      `Cycle ${cycle} • Semaine ${template.week}/4 • Jour ${template.day}/6`;

    $("#cycleProgressText").textContent =
      `${position + 1} / ${PROGRAM.cycleLength}`;

    $("#cycleProgressBar").style.width =
      `${Math.round((position + 1) / PROGRAM.cycleLength * 100)}%`;

    renderMilestones();
  }

  on("#quickStart", "click", () =>
    launchSession(createProgramSession(state.program), false)
  );

  on("#prepareSession", "click", openPlanner);
  on("#openMilestones", "click", () => openLayer("#milestoneModal"));
  on("#closeMilestoneModal", "click", () => closeLayer("#milestoneModal"));

  return {render};
}
