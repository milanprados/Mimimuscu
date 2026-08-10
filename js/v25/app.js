
import {EXERCISES,PROGRAMS,LEVEL_META,workoutTemplate,validateImportedSession,MILESTONES,TEST_SESSION,EXERCISE_LOAD,MUSCLE_GROUPS,compressSessionForDuration,richerSessionToFile,validateRichImportedSession} from "./core/data.js";
import {load,save,dayKey} from "./core/state.js";
import {Engine} from "./core/engine.js";
import {$,$$,on} from "./helpers.js";
import {createWorkoutUI} from "./ui/workout-ui.js";
import {initDictionary} from "./ui/dictionary.js";
import {initSessions} from "./ui/sessions.js";
import {initDashboard} from "./ui/dashboard.js";
import {initProfileProgress} from "./ui/profile-progress.js";

window.__MIMI_BOOT__={version:"23.0",step:"data-loaded",errors:[]};
const state=load(EXERCISES);
window.__MIMI_BOOT__.step="state-loaded";
const level=()=>1+Math.floor(state.xp/500);
const weight=()=>Number(state.profile.weightKg)||null;
const kcal=seconds=>{const w=weight();return w?Math.round(4.5*3.5*w/200*(seconds/60)):null};
const selectedDuration=()=>Number(state.preferences.defaultDuration)||22;

function showTab(tab){
  $$("main section").forEach(section=>section.classList.add("hidden"));
  const target=$(`#${tab}Tab`);
  if(!target){console.warn(`[Mimi Muscu] onglet inconnu: ${tab}`);return}
  target.classList.remove("hidden");
  $$(".tabs button").forEach(button=>button.classList.toggle("active",button.dataset.tab===tab));
}
$$(".tabs button").forEach(button=>button.addEventListener("click",()=>showTab(button.dataset.tab)));

const workoutUI=createWorkoutUI({state,EXERCISES,MUSCLE_GROUPS,EXERCISE_LOAD,save,kcal,level});
const engine=new Engine(state,workoutUI.hooks);
workoutUI.setEngine(engine);
workoutUI.bindStaticControls();

const launchSession=(session,redo=false)=>{workoutUI.openFocus();engine.start(redo,session)};
const launchProgram=redo=>{workoutUI.openFocus();engine.start(redo)};

let refresh=()=>{};

window.__MIMI_BOOT__.step="sessions-init";
const sessions=initSessions({
 state,save,EXERCISES,workoutTemplate,LEVEL_META,
 richerSessionToFile,validateImportedSession,validateRichImportedSession,
 launchSession,launchProgram,refresh:()=>refresh()
});

window.__MIMI_BOOT__.step="dashboard-init";
const dashboard=initDashboard({
 state,save,EXERCISES,PROGRAMS,LEVEL_META,MILESTONES,TEST_SESSION,
 workoutTemplate,compressSessionForDuration,launchSession,
 openPlanner:sessions.openPlanner,refresh:()=>refresh()
});

function coachText(){
  const tpl=workoutTemplate(state.program),last=state.history[0],out=[
    "Analyse ma progression et donne-moi des conseils courts, concrets et adaptés à mon objectif esthétique.",
    `Programme ${LEVEL_META[state.program.level].name}, séance prévue ${tpl.key} ${tpl.name}.`,
    `Profil: ${state.profile.age||"?"} ans, ${state.profile.heightCm||"?"} cm, ${state.profile.weightKg||"?"} kg.`,
    `Durée habituelle: ${selectedDuration()} min.`,
    `Streak: ${state.streak}. XP: ${state.xp}.`
  ];
  if(last){out.push(`Dernière séance: ${last.sessionName||"Séance"}, score ${last.score}/100, durée ${last.duration}s.`);for(const set of last.sets||[])out.push(set.skipped?`- ${set.name}: passé`:`- ${set.name}: ${set.actual}/${set.target} (${set.effort})`)}
  const latest=state.measurements[state.measurements.length-1];if(latest)out.push(`Dernière mesure: ${latest.weightKg||"?"} kg, tour de taille ${latest.waistCm||"?"} cm.`);
  return out.join("\n");
}

window.__MIMI_BOOT__.step="profile-init";
const profileProgress=initProfileProgress({
 state,save,EXERCISES,dayKey,selectedDuration,level,coachText,refresh:()=>refresh()
});

window.__MIMI_BOOT__.step="dictionary-init";
initDictionary({EXERCISES});

on("#redoSession","click",()=>launchProgram(true));

refresh=()=>{
  dashboard.render();
  sessions.renderCustomSessions();
  profileProgress.render();
  save(state);
};

window.addEventListener("mimi:refresh",event=>{
  window.__MIMI_BOOT__.step="first-refresh";
refresh();
window.__MIMI_BOOT__.step="ready";
  if(event.detail?.tab)showTab(event.detail.tab);
});

refresh();

if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").then(reg=>{
    if(reg.waiting) $("#updateToast")?.classList.remove("hidden");
    reg.addEventListener("updatefound",()=>{
      const worker=reg.installing;
      worker?.addEventListener("statechange",()=>{
        if(worker.state==="installed" && navigator.serviceWorker.controller){
          $("#updateToast")?.classList.remove("hidden");
        }
      });
    });
    on("#applyUpdate","click",()=>location.reload());
  }).catch(console.warn);
}
