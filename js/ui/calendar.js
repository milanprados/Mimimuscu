import { $, $$, on, openLayer, closeLayer } from "../utils/dom.js";
import { buildRollingSchedule } from "../core/calendar.js";
import {
  startOfDay,
  localDayKey,
  parseLocalDayKey,
  addDays,
  mondayOfWeek,
  isRestDay,
  monthCells,
  formatShortDate,
  formatLongDate,
} from "../utils/dates.js";
import { isProgramHistoryRecord } from "../core/progression.js";

const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export function createCalendarView({
  state,
  save,
  PROGRAMS,
  programSession,
  launchSession,
}) {
  let viewDate = startOfDay(new Date());
  let selectedKey = localDayKey(viewDate);

  const today = () => startOfDay(new Date());
  const todayKey = () => localDayKey(today());
  const programs = () =>
    Array.isArray(PROGRAMS.adaptive) ? PROGRAMS.adaptive : [];
  const restDay = () => Number(state.calendarPrefs?.restDay) || 0;
  const programHistoryFor = (key) =>
    state.history.filter(
      (h) =>
        h.day === key &&
        isProgramHistoryRecord(h) &&
        (h.programCompleted === true || h.counted),
    );
  const countedToday = () => programHistoryFor(todayKey()).length > 0;
  const historiesFor = (key) => state.history.filter((h) => h.day === key);
  const countedFor = (key) => historiesFor(key).filter((h) => h.counted);

  function schedule(days = 400) {
    return buildRollingSchedule({
      today: today(),
      programIndex: state.program.index,
      programTemplates: programs(),
      restDay: restDay(),
      programDoneToday: countedToday(),
      days,
    });
  }
  function scheduleMap(days = 400) {
    return new Map(schedule(days).map((x) => [x.key, x]));
  }

  function dateStatus(date, smap = scheduleMap()) {
    const key = localDayKey(date),
      actual = countedFor(key),
      programActual = programHistoryFor(key);
    if (programActual.length)
      return {
        type: "done",
        key,
        actual: programActual[0],
        all: historiesFor(key),
      };
    if (key < todayKey() && actual.length)
      return { type: "done", key, actual: actual[0], all: historiesFor(key) };
    if (key < todayKey()) {
      if (isRestDay(date, restDay())) return { type: "rest", key };
      return { type: "past", key };
    }
    const planned = smap.get(key);
    if (planned?.type === "rest") return { type: "rest", key, planned };
    if (planned?.type === "planned") return { type: "planned", key, planned };
    if (planned?.type === "done-today") return { type: "today-done", key };
    return { type: "empty", key };
  }

  function renderHome() {
    const now = today(),
      smap = scheduleMap(60),
      status = dateStatus(now, smap);
    $("#calendarTodayDate").textContent = formatLongDate(now);
    const title = $("#calendarTodayTitle"),
      sub = $("#calendarTodaySub"),
      badge = $("#calendarTodayBadge");
    if (status.type === "done") {
      title.textContent = "Séance terminée";
      sub.textContent = `${status.actual.sessionName || "Séance"} · ${status.actual.score}/100 · ${Math.round((status.actual.duration || 0) / 60)} min`;
      badge.textContent = "FAIT";
      badge.className = "calendar-status done";
    } else if (status.type === "rest") {
      const next = schedule(20).find((x) => x.type === "planned");
      title.textContent = "Repos prévu";
      sub.textContent = next
        ? `Prochaine séance : ${next.template?.name || "Séance"} · ${formatShortDate(next.date)}`
        : "Récupération";
      badge.textContent = "REPOS";
      badge.className = "calendar-status rest";
    } else if (status.type === "planned") {
      title.textContent = status.planned.template?.name || "Séance du jour";
      sub.textContent = `Semaine ${status.planned.week}/4 · Jour ${status.planned.day}/6 · ~20 min`;
      badge.textContent =
        status.planned.template?.intensity === "léger" ? "LÉGER" : "PRÉVU";
      badge.className = "calendar-status planned";
    } else {
      title.textContent = "Journée libre";
      sub.textContent = "Aucune séance planifiée.";
      badge.textContent = "LIBRE";
      badge.className = "calendar-status";
    }

    const monday = mondayOfWeek(now);
    $("#homeWeekStrip").innerHTML = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i),
        st = dateStatus(d, smap),
        isToday = localDayKey(d) === todayKey();
      return `<div class="week-day ${st.type} ${isToday ? "today" : ""}">
        <small>${new Intl.DateTimeFormat("fr-FR", { weekday: "narrow" }).format(d)}</small>
        <b>${d.getDate()}</b><i></i>
      </div>`;
    }).join("");

    const nextRows = schedule(14)
      .filter((x) => x.key > todayKey())
      .slice(0, 3);
    $("#homeUpcoming").innerHTML = nextRows
      .map((x) => {
        if (x.type === "rest")
          return `<div class="home-next-row rest"><span>${formatShortDate(x.date)}</span><strong>Repos</strong><em>récupération</em></div>`;
        if (x.type !== "planned") return "";
        return `<div class="home-next-row"><span>${formatShortDate(x.date)}</span><strong>${x.template?.name || "Séance"}</strong><em>S${x.week} · J${x.day}/6</em></div>`;
      })
      .join("");
  }

  function renderMonth() {
    const year = viewDate.getFullYear(),
      month = viewDate.getMonth(),
      smap = scheduleMap(420);
    $("#calendarMonthLabel").textContent = `${MONTH_NAMES[month]} ${year}`;
    const cells = monthCells(year, month);
    $("#calendarGrid").innerHTML = cells
      .map((date) => {
        const key = localDayKey(date),
          st = dateStatus(date, smap);
        const outside = date.getMonth() !== month,
          todayClass = key === todayKey() ? "today" : "",
          selected = key === selectedKey ? "selected" : "";
        const marker =
          st.type === "done"
            ? "✓"
            : st.type === "planned"
              ? "•"
              : st.type === "rest"
                ? "—"
                : "";
        const meta =
          st.type === "planned"
            ? `<small>S${st.planned.week}J${st.planned.day}</small>`
            : st.type === "done"
              ? `<small>fait</small>`
              : st.type === "rest"
                ? `<small>repos</small>`
                : "";
        return `<button class="calendar-cell ${st.type} ${outside ? "outside" : ""} ${todayClass} ${selected}" data-date="${key}">
        <span>${date.getDate()}</span><b>${marker}</b>${meta}
      </button>`;
      })
      .join("");
    $$("[data-date]").forEach((b) =>
      b.addEventListener("click", () => {
        selectedKey = b.dataset.date;
        const d = parseLocalDayKey(selectedKey);
        viewDate = new Date(d.getFullYear(), d.getMonth(), 1);
        renderMonth();
        renderSelected();
      }),
    );
    renderSelected();
    renderUpcoming();
  }

  function renderSelected() {
    const date = parseLocalDayKey(selectedKey),
      st = dateStatus(date),
      box = $("#calendarSelected");
    $("#calendarSelectedDate").textContent = formatLongDate(date);
    if (st.type === "done") {
      const all = historiesFor(selectedKey),
        primary = st.actual;
      box.innerHTML = `<div class="selected-status done">Séance faite</div>
        <h3>${primary.sessionName || "Séance"}</h3>
        <div class="selected-metrics"><div><strong>${primary.score}</strong><small>score</small></div><div><strong>${Math.round((primary.duration || 0) / 60)}</strong><small>min</small></div><div><strong>+${primary.xp}</strong><small>XP</small></div></div>
        ${all.length > 1 ? `<p>${all.length} entraînements enregistrés ce jour-là.</p>` : ""}`;
    } else if (st.type === "planned") {
      const p = st.planned;
      box.innerHTML = `<div class="selected-status planned">Prévu</div>
        <h3>${p.template?.name || "Séance"}</h3>
        <p>${p.template?.focus || "Full body"} · Semaine ${p.week}/4 · Jour ${p.day}/6 · ~20 min</p>
        ${selectedKey === todayKey() ? `<button class="primary-btn calendar-start" id="calendarStartToday">Lancer la séance</button>` : ""}`;
      on(
        "#calendarStartToday",
        "click",
        () => {
          closeLayer("#calendarModal");
          launchSession(programSession(state.program), false);
        },
        { required: false },
      );
    } else if (st.type === "rest") {
      box.innerHTML = `<div class="selected-status rest">Repos</div><h3>Récupération</h3><p>Pas de séance prévue. Marche, mobilité légère ou rien du tout : le repos fait partie du programme.</p>`;
    } else if (st.type === "past") {
      box.innerHTML = `<div class="selected-status neutral">Aucune séance</div><h3>Journée sans entraînement enregistré</h3><p>Mimi ne la compte pas comme un échec : le planning futur se recale sur ton avancement réel.</p>`;
    } else {
      box.innerHTML = `<div class="selected-status neutral">Libre</div><h3>Aucun événement</h3>`;
    }
  }

  function renderUpcoming() {
    const rows = schedule(30)
      .filter((x) => x.key >= todayKey())
      .slice(0, 10);
    $("#calendarUpcomingList").innerHTML = rows
      .map((x) => {
        const actual = countedFor(x.key)[0];
        if (actual)
          return `<div class="calendar-agenda done"><time>${formatShortDate(x.date)}</time><div><strong>${actual.sessionName || "Séance"}</strong><small>${actual.score}/100 · terminé</small></div><span>✓</span></div>`;
        if (x.type === "rest")
          return `<div class="calendar-agenda rest"><time>${formatShortDate(x.date)}</time><div><strong>Repos</strong><small>récupération</small></div><span>—</span></div>`;
        if (x.type === "planned")
          return `<div class="calendar-agenda planned"><time>${formatShortDate(x.date)}</time><div><strong>${x.template?.name || "Séance"}</strong><small>S${x.week} · J${x.day}/6 · ${x.template?.intensity || ""}</small></div><span>→</span></div>`;
        return "";
      })
      .join("");
  }

  function openCalendar() {
    viewDate = new Date(today().getFullYear(), today().getMonth(), 1);
    selectedKey = todayKey();
    $("#restDaySelect").value = String(restDay());
    renderMonth();
    openLayer("#calendarModal");
  }

  on("#openCalendar", "click", openCalendar);
  on("#openCalendarProgress", "click", openCalendar, { required: false });
  on("#closeCalendar", "click", () => closeLayer("#calendarModal"));
  on("#calendarPrev", "click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderMonth();
  });
  on("#calendarNext", "click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderMonth();
  });
  on("#calendarTodayBtn", "click", () => {
    viewDate = new Date(today().getFullYear(), today().getMonth(), 1);
    selectedKey = todayKey();
    renderMonth();
  });
  on("#restDaySelect", "change", () => {
    state.calendarPrefs.restDay = Number($("#restDaySelect").value);
    save(state);
    renderHome();
    renderMonth();
  });

  function render() {
    renderHome();
  }
  return { render, openCalendar };
}
