
import {$,$$,on,openLayer,closeLayer} from "../helpers.js";

export function initDashboard({
 state,save,EXERCISES,PROGRAMS,LEVEL_META,MILESTONES,TEST_SESSION,
 workoutTemplate,compressSessionForDuration,launchSession,openPlanner,refresh
}) {
  const selectedDuration=()=>Number(state.preferences.defaultDuration)||22;
  const recentSessions=(n=3)=>state.history.filter(h=>h.counted).slice(0,n);
  const daysBetween=(a,b)=>!a||!b?Infinity:Math.floor((new Date(b)-new Date(a))/86400000);

  function coachRecommendation(){
    const recent=recentSessions(3);
    if(!recent.length)return"Commence tranquillement : priorité à la technique et à la régularité.";
    const hard=recent.flatMap(h=>h.sets||[]).filter(s=>s.effort==="hard"&&!s.skipped).length;
    const total=recent.flatMap(h=>h.sets||[]).filter(s=>!s.skipped).length||1;
    if(hard/total>.45)return"Tes dernières séances étaient assez dures. Garde le volume stable aujourd’hui.";
    const score=recent.reduce((a,h)=>a+(h.score||0),0)/recent.length;
    if(score>=92)return"Tu encaisses très bien le programme. Les objectifs vont monter doucement.";
    return"Rythme cohérent. Vise surtout des répétitions propres.";
  }

  function benchmarkDue(){
    const last=state.benchmark.lastDate;
    if(!last)return state.sessions>=6;
    return daysBetween(last,new Date().toISOString()) >= (state.benchmark.dueEveryDays||28);
  }

  function adaptiveSessionBase(){
    const tpl=workoutTemplate(state.program);
    const ids=Array.isArray(tpl.ids)?tpl.ids:[];
    return {id:`program-${tpl.key}`,name:tpl.name,description:tpl.focus,level:state.program.level,
      exercises:ids.map((id,index)=>({id,restAfter:index===3?45:25}))};
  }
  function sessionForToday(){return compressSessionForDuration(adaptiveSessionBase(),selectedDuration())}
  function milestoneProgress(m){const best=state.bests[m.exerciseId]||0;return Math.max(0,Math.min(100,Math.round(best/m.value*100)))}

  function renderMilestones(){
    $("#milestonePreview").innerHTML=MILESTONES.slice(0,3).map(m=>{
      const p=milestoneProgress(m),best=state.bests[m.exerciseId]||0;
      return `<div class="milestone"><div class="milestone-top"><strong>${m.label}</strong><span>${best}/${m.value}</span></div><div class="milestone-bar"><div style="width:${p}%"></div></div></div>`;
    }).join("");
    $("#milestoneList").innerHTML=MILESTONES.map(m=>{
      const p=milestoneProgress(m),best=state.bests[m.exerciseId]||0;
      return `<div class="card"><div class="milestone-top"><strong>${m.label}</strong><span>${p}%</span></div><div class="milestone-bar"><div style="width:${p}%"></div></div><p class="muted">${best} / ${m.value}</p></div>`;
    }).join("");
  }

  function render(){
    const tpl=workoutTemplate(state.program),meta=LEVEL_META[state.program.level],today=sessionForToday();
    $("#sessionLabel").textContent=`Séance ${tpl.key} • ${meta.name}`;
    $("#sessionName").textContent=today.name;
    $("#sessionFocus").textContent=today.description||tpl.focus;
    $("#dashDuration").textContent=`${selectedDuration()} min`;
    $("#dailyCoachText").textContent=coachRecommendation();
    $$("[data-duration]").forEach(b=>b.classList.toggle("active",Number(b.dataset.duration)===selectedDuration()));
    $("#benchmarkCard").classList.toggle("hidden",!benchmarkDue());
    $("#programName").textContent=meta.name;
    $("#programFrequency").textContent=`${meta.sessions} séances / semaine`;
    $("#programLevel").value=state.program.level;
    $("#rotationText").textContent=(PROGRAMS[state.program.level]||PROGRAMS.beginner).map(x=>x.key).join(" → ");
    renderMilestones();
  }

  $$("[data-duration]").forEach(button=>button.addEventListener("click",()=>{
    state.preferences.defaultDuration=Number(button.dataset.duration);save(state);refresh();
  }));
  on("#quickStart","click",()=>launchSession(sessionForToday(),false));
  on("#programLevel","change",()=>{
    state.program.level=$("#programLevel").value;state.program.index=0;state.sessionDraft=null;save(state);refresh();
  });
  on("#openMilestones","click",()=>openLayer("#milestoneModal"));
  on("#closeMilestoneModal","click",()=>closeLayer("#milestoneModal"));
  on("#startBenchmark","click",()=>launchSession(TEST_SESSION,false));

  return {render,sessionForToday};
}
