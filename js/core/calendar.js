/**
 * Calcul pur du planning futur.
 * Aucun DOM ici, donc ce module est facile à tester.
 */
import { addDays, isRestDay, localDayKey, startOfDay } from "../utils/dates.js";

export function buildRollingSchedule({
  today = new Date(),
  programIndex = 0,
  programTemplates = [],
  restDay = 0,
  programDoneToday = false,
  days = 400,
} = {}) {
  const result = [];
  const firstDay = startOfDay(today);
  const templates = Array.isArray(programTemplates) ? programTemplates : [];
  let nextProgramIndex = Math.max(0, Number(programIndex) || 0);

  for (let offset = 0; offset < days; offset++) {
    const date = addDays(firstDay, offset);
    const key = localDayKey(date);

    if (isRestDay(date, restDay)) {
      result.push({ key, date, type: "rest" });
      continue;
    }

    if (offset === 0 && programDoneToday) {
      result.push({ key, date, type: "done-today" });
      continue;
    }

    const template = templates.length
      ? templates[nextProgramIndex % templates.length]
      : null;

    result.push({
      key,
      date,
      type: "planned",
      programIndex: nextProgramIndex,
      template,
      cycle: Math.floor(nextProgramIndex / 24) + 1,
      position: nextProgramIndex % 24,
      week: template?.week || Math.floor((nextProgramIndex % 24) / 6) + 1,
      day: template?.day || (nextProgramIndex % 6) + 1,
    });

    nextProgramIndex++;
  }

  return result;
}
