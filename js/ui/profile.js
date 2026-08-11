/**
 * Onglet Profil : fiche athlète, objectifs personnels, mensurations et sauvegarde.
 */
import {$, $$, on, openLayer, closeLayer} from "../utils/dom.js";
import {localDayKey} from "../utils/dates.js";
import {PROGRESSION, PROGRAM} from "../config.js";
import {
  PROGRESSION_AXES,
  getGoalCurrentValue,
  getGoalProgress,
  isProgramHistoryRecord,
  levelFromXp
} from "../core/progression.js";
import {createBackup, validateBackup, downloadJson} from "../utils/backup.js";
import {replaceState, resetProgression} from "../core/state.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const roundOne = value => Math.round(value * 10) / 10;
const percentText = value => `${value >= 0 ? "+" : ""}${Math.round(value)}%`;

function createId() {
  return globalThis.crypto?.randomUUID?.()
    || `goal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function titleForSessions(count) {
  if (count >= 60) return "Machine";
  if (count >= 36) return "Athlétique";
  if (count >= 18) return "Solide";
  if (count >= 6) return "Régulier";
  return "Démarrage";
}

function formatExerciseValue(exercise, value) {
  if (value == null || value === "") return "—";
  return `${Math.round(value)}${exercise?.mode === "time" ? " s" : exercise?.perSide ? " / côté" : ""}`;
}

function renderAxes(snapshot) {
  return Object.entries(PROGRESSION_AXES).map(([key, axis]) => {
    const value = snapshot.indices[key];
    const gain = value - PROGRESSION.baselineIndex;
    const width = clamp((value - 70) / 80 * 100, 6, 100);

    return `
      <div class="axis-row compact">
        <div class="axis-head">
          <div><strong>${axis.label}</strong><small>${axis.hint}</small></div>
          <b>${value}</b>
        </div>
        <div class="axis-track">
          <span style="width:${width}%"></span>
          <i style="left:${clamp((100 - 70) / 80 * 100, 0, 100)}%"></i>
        </div>
        <div class="axis-foot">
          <span>100 = départ</span>
          <em class="${gain >= 0 ? "up" : "down"}">${percentText(gain)}</em>
        </div>
      </div>`;
  }).join("");
}

function performanceNarrative(snapshot, sessions) {
  if (sessions < 3) {
    return "Ton profil démarre à l’indice 100. Les barres vont devenir plus parlantes après quelques séances.";
  }

  const axes = Object.entries(PROGRESSION_AXES)
    .map(([key, axis]) => ({label: axis.label, gain: snapshot.indices[key] - 100}))
    .sort((a, b) => b.gain - a.gain);

  const best = axes[0];
  const lowest = axes.at(-1);

  if (best.gain >= 8 && best.gain - lowest.gain >= 8) {
    return `${best.label} est ton axe qui progresse le plus : ${percentText(best.gain)} depuis ton niveau de départ.`;
  }

  if (snapshot.indices.regularity >= 85) {
    return "Ta régularité est ton gros point fort en ce moment. Continue à protéger les journées légères.";
  }

  return "Progression homogène : laisse l’adaptation automatique faire monter les objectifs progressivement.";
}

function cycleStats(records) {
  if (!records.length) return {score: null, minutes: 0, repetitions: 0};

  let repetitions = 0;

  for (const record of records) {
    for (const set of record.sets || []) {
      if (!set.skipped && set.mode === "reps") repetitions += Number(set.actual) || 0;
    }
  }

  return {
    score: Math.round(
      records.reduce((sum, record) => sum + Number(record.score || 0), 0) / records.length
    ),
    minutes: Math.round(
      records.reduce((sum, record) => sum + Number(record.duration || 0), 0) / 60
    ),
    repetitions
  };
}

export function createProfileView({
  state,
  exercises,
  save,
  refresh,
  getSnapshot,
  coachText
}) {
  function initials() {
    const name = (state.profileMeta.nickname || "Mimi Muscu").trim();
    return name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "MM";
  }

  function renderActivity(snapshot) {
    const activeDays = snapshot.activityDays.filter(day => day.count).length;
    const lastWeek = snapshot.activityDays.slice(-7).filter(day => day.count).length;

    $("#activityHeatmap").innerHTML = snapshot.activityDays.map(day =>
      `<i class="heat-${Math.min(3, day.count)}" title="${day.date.toLocaleDateString("fr-FR")}"></i>`
    ).join("");

    $("#activityCaption").textContent = `${activeDays} jours actifs sur les 42 derniers jours`;
    $("#weeklyConsistency").textContent = `${lastWeek}/6`;
  }

  function renderCycle(snapshot) {
    const cycle = snapshot.cycle;
    const programRecords = state.history.filter(record =>
      isProgramHistoryRecord(record)
      && (record.programCompleted === true || record.counted)
    );

    const currentRecords = programRecords.slice(0, cycle.position);
    const previousRecords = cycle.completed >= PROGRAM.cycleLength
      ? programRecords.slice(cycle.position, cycle.position + PROGRAM.cycleLength)
      : [];

    const current = cycleStats(currentRecords);
    const previous = cycleStats(previousRecords);

    $("#profileCycleTitle").textContent = `Cycle ${cycle.cycle} · Semaine ${cycle.week}/4`;
    $("#profileCycleCount").textContent = `${cycle.position}/${PROGRAM.cycleLength}`;

    $("#profileCycleDots").innerHTML = Array.from({length: PROGRAM.cycleLength}, (_, index) =>
      `<i class="${index < cycle.position ? "done" : index === cycle.position ? "next" : ""}"></i>`
    ).join("");

    $("#cycleCurrentStats").innerHTML = `
      <div><strong>${current.score ?? "—"}</strong><span>score moyen</span></div>
      <div><strong>${current.minutes}</strong><span>minutes</span></div>
      <div><strong>${current.repetitions}</strong><span>répétitions</span></div>`;

    if (previous.score == null) {
      $("#lastCycleReport").classList.add("hidden");
      return;
    }

    $("#lastCycleReport").classList.remove("hidden");
    $("#lastCycleReport").innerHTML = `
      <span class="eyebrow">DERNIER CYCLE</span>
      <strong>${previous.score}/100 de moyenne · ${previous.minutes} min · ${previous.repetitions} reps</strong>
      <p>Le cycle suivant conserve tes objectifs adaptés.</p>`;
  }

  function renderRecords(snapshot) {
    const rows = snapshot.records.slice(0, 6);

    $("#profileRecords").innerHTML = rows.length
      ? rows.map(item => `
          <div class="record-tile">
            <span>PR</span>
            <strong>${formatExerciseValue(item.exercise, item.best)}</strong>
            <small>${item.exercise.name}</small>
          </div>`).join("")
      : `<div class="empty-state">Tes premiers records apparaîtront après quelques séances.</div>`;
  }

  function renderBeforeAfter(snapshot) {
    const rows = snapshot.beforeAfter.slice(0, 4);

    $("#profileSinceStart").innerHTML = rows.length
      ? rows.map(item => `
          <div class="before-after-card">
            <small>${item.exercise.name}</small>
            <div>
              <span>${formatExerciseValue(item.exercise, item.first)}</span>
              <b>→</b>
              <strong>${formatExerciseValue(item.exercise, item.current)}</strong>
            </div>
            <em>${percentText(item.gainPercent)}</em>
          </div>`).join("")
      : `<div class="empty-state">Il faut quelques repères pour comparer le départ à aujourd’hui.</div>`;
  }

  function goalUnit(goal) {
    if (goal.type === "weight") return "kg";
    if (goal.type === "waist") return "cm";

    const exercise = exercises[goal.exerciseId];
    if (exercise?.mode === "time") return "s";
    if (exercise?.perSide) return "/ côté";
    return "reps";
  }

  function renderGoals(snapshot) {
    if (!state.goals.length) {
      $("#profileGoals").innerHTML =
        `<div class="empty-state">Ajoute un objectif perso : un record, un poids ou un tour de taille.</div>`;
      return;
    }

    $("#profileGoals").innerHTML = state.goals.map(goal => {
      const current = getGoalCurrentValue(goal, state, exercises, snapshot);
      const progress = getGoalProgress(goal, state, exercises, snapshot);
      const unit = goalUnit(goal);

      const label = goal.type === "exercise"
        ? exercises[goal.exerciseId]?.name || "Exercice"
        : goal.type === "weight"
          ? "Poids"
          : "Tour de taille";

      const format = value =>
        value == null ? "—" : `${roundOne(Number(value))} ${unit}`;

      return `
        <div class="goal-card">
          <div class="goal-top">
            <div><small>${label}</small><strong>${format(current)} → ${format(goal.target)}</strong></div>
            <button data-delete-goal="${goal.id}">×</button>
          </div>
          <div class="goal-track"><span style="width:${progress}%"></span></div>
          <em>${progress}%</em>
        </div>`;
    }).join("");

    $$("[data-delete-goal]").forEach(button => {
      button.addEventListener("click", () => {
        state.goals = state.goals.filter(goal => goal.id !== button.dataset.deleteGoal);
        save(state);
        refresh();
      });
    });
  }

  function renderBody(snapshot) {
    const body = snapshot.body;
    const delta = (value, unit) => value == null
      ? "Pas encore de comparaison"
      : `${value > 0 ? "+" : ""}${value} ${unit} depuis la première mesure`;

    $("#profileBodySummary").innerHTML = `
      <div>
        <small>Poids</small>
        <strong>${body.currentWeight ?? "—"} <em>${body.currentWeight ? "kg" : ""}</em></strong>
        <span>${delta(body.weightDelta, "kg")}</span>
      </div>
      <div>
        <small>Tour de taille</small>
        <strong>${body.currentWaist ?? "—"} <em>${body.currentWaist ? "cm" : ""}</em></strong>
        <span>${delta(body.waistDelta, "cm")}</span>
      </div>`;
  }

  function render(snapshot) {
    const level = levelFromXp(state.xp);
    const xpInLevel = state.xp % PROGRESSION.xpPerLevel;

    $("#homeLevel").textContent = `LV ${level}`;
    $("#profileAvatar").textContent = initials();
    $("#profileNickname").textContent = (state.profileMeta.nickname || "Mimi Athlete").trim();
    $("#profileTitle").textContent = titleForSessions(state.sessions);

    $("#profileLevel").textContent = `LV ${level}`;
    $("#profileXpLabel").textContent =
      `${xpInLevel} / ${PROGRESSION.xpPerLevel} XP vers LV ${level + 1}`;
    $("#profileXpBar").style.width =
      `${Math.round(xpInLevel / PROGRESSION.xpPerLevel * 100)}%`;

    $("#profileIndex").textContent = snapshot.indices.physical;
    const delta = snapshot.indices.physical - PROGRESSION.baselineIndex;
    $("#profileIndexDelta").textContent = percentText(delta);
    $("#profileIndexDelta").className = delta >= 0 ? "positive" : "negative";

    $("#profileSessions").textContent = state.sessions;
    $("#profileStreak").textContent = state.streak;
    $("#profileRegularity").textContent = `${snapshot.indices.regularity}%`;
    $("#profileTotalReps").textContent = snapshot.totals.repetitions.toLocaleString("fr-FR");

    $("#profileNarrative").textContent = performanceNarrative(snapshot, state.sessions);
    $("#profileAxes").innerHTML = renderAxes(snapshot);
    $("#coachPrompt").value = coachText();

    const todayDone = state.history.some(record =>
      record.day === localDayKey() && record.counted
    );
    $("#todayText").textContent = todayDone
      ? "Une séance est enregistrée aujourd’hui."
      : "Aucune séance terminée.";
    $("#redoSession").classList.toggle("hidden", !todayDone);

    renderActivity(snapshot);
    renderCycle(snapshot);
    renderRecords(snapshot);
    renderBeforeAfter(snapshot);
    renderGoals(snapshot);
    renderBody(snapshot);
  }

  // Profil --------------------------------------------------------------------
  on("#openEditProfile", "click", () => {
    $("#nickname").value = state.profileMeta.nickname || "";
    $("#age").value = state.profile.age || "";
    $("#height").value = state.profile.heightCm || "";
    $("#weight").value = state.profile.weightKg || "";
    openLayer("#profileEditModal");
  });

  on("#closeProfileEdit", "click", () => closeLayer("#profileEditModal"));

  on("#saveProfile", "click", () => {
    state.profileMeta.nickname = $("#nickname").value.trim();
    state.profile = {
      age: $("#age").value,
      heightCm: $("#height").value,
      weightKg: $("#weight").value
    };

    if (state.profile.weightKg && !state.measurements.length) {
      state.measurements.push({
        date: new Date().toISOString(),
        weightKg: Number(state.profile.weightKg),
        waistCm: null,
        note: "Mesure initiale"
      });
    }

    save(state);
    closeLayer("#profileEditModal");
    refresh();
  });

  // Mensurations --------------------------------------------------------------
  on("#addMeasurement", "click", () => {
    $("#measureWeight").value = state.profile.weightKg || "";
    $("#measureWaist").value = "";
    $("#measureNote").value = "";
    openLayer("#measurementModal");
  });

  on("#closeMeasurementModal", "click", () => closeLayer("#measurementModal"));

  on("#saveMeasurement", "click", () => {
    const weight = Number($("#measureWeight").value);
    const waist = Number($("#measureWaist").value);

    if (!weight && !waist) {
      alert("Ajoute au moins le poids ou le tour de taille.");
      return;
    }

    state.measurements.push({
      date: new Date().toISOString(),
      weightKg: weight || null,
      waistCm: waist || null,
      note: $("#measureNote").value.trim()
    });

    state.measurements = state.measurements.slice(-180);
    if (weight) state.profile.weightKg = String(weight);

    save(state);
    closeLayer("#measurementModal");
    refresh();
  });

  // Objectifs personnels -------------------------------------------------------
  function fillGoalExerciseSelect() {
    $("#goalExercise").innerHTML = Object.entries(exercises)
      .filter(([, exercise]) => exercise.quiet && exercise.equipment === "none")
      .sort((a, b) => a[1].name.localeCompare(b[1].name, "fr"))
      .map(([id, exercise]) => `<option value="${id}">${exercise.name}</option>`)
      .join("");
  }

  function syncGoalForm() {
    const type = $("#goalType").value;
    $("#goalExerciseWrap").classList.toggle("hidden", type !== "exercise");
    $("#goalUnit").textContent = type === "weight" ? "kg" : type === "waist" ? "cm" : "";
    $("#goalTarget").step = type === "exercise" ? "1" : "0.1";
  }

  on("#addGoal", "click", () => {
    fillGoalExerciseSelect();
    $("#goalType").value = "exercise";
    $("#goalTarget").value = "";
    syncGoalForm();
    openLayer("#goalModal");
  });

  on("#closeGoalModal", "click", () => closeLayer("#goalModal"));
  on("#goalType", "change", syncGoalForm);

  on("#saveGoal", "click", () => {
    const snapshot = getSnapshot();
    const type = $("#goalType").value;
    const target = Number($("#goalTarget").value);

    if (!(target > 0)) {
      alert("Entre un objectif valide.");
      return;
    }

    let startValue = null;
    let exerciseId = null;

    if (type === "exercise") {
      exerciseId = $("#goalExercise").value;
      startValue = Number(state.bests[exerciseId]) || 0;
    } else {
      startValue = type === "weight"
        ? snapshot.body.currentWeight
        : snapshot.body.currentWaist;

      if (startValue == null) {
        alert("Ajoute d’abord une mesure actuelle.");
        return;
      }
    }

    state.goals.push({
      id: createId(),
      type,
      exerciseId,
      target,
      startValue,
      createdAt: new Date().toISOString()
    });

    state.goals = state.goals.slice(-12);
    save(state);
    closeLayer("#goalModal");
    refresh();
  });

  // Réglages / sauvegarde ------------------------------------------------------
  on("#autoSuggest", "change", () => {
    state.preferences.autoSuggest = $("#autoSuggest").checked;
    save(state);
  });

  on("#exportBackup", "click", () => {
    const backup = createBackup(state);
    state.backupMeta.lastExportAt = backup.exported_at;
    save(state);

    downloadJson(
      `mimi-muscu-backup-${new Date().toISOString().slice(0, 10)}.json`,
      backup
    );

    $("#backupStatus").textContent = "Sauvegarde exportée ✓";
  });

  on("#resetProgression", "click", () => openLayer("#resetProgressionModal"));
  on("#closeResetProgression", "click", () => closeLayer("#resetProgressionModal"));
  on("#cancelResetProgression", "click", () => closeLayer("#resetProgressionModal"));

  on("#confirmResetProgression", "click", () => {
    resetProgression(state, exercises);
    save(state);
    closeLayer("#resetProgressionModal");
    refresh();

    const status = $("#backupStatus");
    if (status) status.textContent = "Progression réinitialisée ✓";
  });

  on("#importBackup", "click", () => $("#backupFileInput").click());

  on("#backupFileInput", "change", async () => {
    const file = $("#backupFileInput").files?.[0];
    if (!file) return;

    try {
      const imported = validateBackup(JSON.parse(await file.text()));
      if (!confirm("Remplacer toutes les données locales par cette sauvegarde ?")) return;
      replaceState(imported);
      location.reload();
    } catch (error) {
      alert(error.message || "Sauvegarde invalide.");
    }
  });

  on("#openChat", "click", async () => {
    try {
      await navigator.clipboard.writeText($("#coachPrompt").value);
    } catch (_) {}
    window.open("https://chatgpt.com/", "_blank");
  });

  return {render};
}
