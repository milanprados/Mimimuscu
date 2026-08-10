
import {$,on,openLayer,closeLayer} from "../helpers.js";

export function initDashboard({
 state,save,PROGRAMS,MILESTONES,workoutTemplate,programSession,launchSession,openPlanner
}) {
  const recentSessions=(n=3)=>state.history.filter(h=>h.counted).slice(0,n);

  function coachRecommendation(tpl){
    if(tpl.intensity==="léger") return "Journée volontairement plus légère : technique propre, respiration et récupération active.";
    const recent=recentSessions(3);
    if(!recent.length)return"Première semaine : garde 1–3 répétitions en réserve et apprends les mouvements proprement.";
    const hard=recent.flatMap(h=>h.sets||[]).filter(s=>s.effort==="hard"&&!s.skipped).length;
    const total=recent.flatMap(h=>h.sets||[]).filter(s=>!s.skipped).length||1;
    if(hard/total>.45)return"Tu as beaucoup forcé récemment : ne cherche pas l’échec aujourd’hui, garde une exécution propre.";
    const score=recent.reduce((a,h)=>a+(h.score||0),0)/recent.length;
    if(score>=92)return"Bonne progression : les objectifs de reps/temps s’ajustent automatiquement sur les journées de progression.";
    return"Reste régulier : 20 minutes propres valent mieux qu’une séance trop dure que tu ne récupères pas.";
  }

  function milestoneProgress(m){
    const best=state.bests[m.exerciseId]||0;
    return Math.max(0,Math.min(100,Math.round(best/m.value*100)))
  }

  function renderMilestones(){
    const safe=Array.isArray(MILESTONES)?MILESTONES:[];
    $("#milestonePreview").innerHTML=safe.slice(0,3).map(m=>{
      const p=milestoneProgress(m),best=state.bests[m.exerciseId]||0;
      return `<div class="milestone"><div class="milestone-top"><strong>${m.label}</strong><span>${best}/${m.value}</span></div><div class="milestone-bar"><div style="width:${p}%"></div></div></div>`;
    }).join("");
    $("#milestoneList").innerHTML=safe.map(m=>{
      const p=milestoneProgress(m),best=state.bests[m.exerciseId]||0;
      return `<div class="card"><div class="milestone-top"><strong>${m.label}</strong><span>${p}%</span></div><div class="milestone-bar"><div style="width:${p}%"></div></div><p class="muted">${best} / ${m.value}</p></div>`;
    }).join("");
  }

  function renderCycle(){
    const total=24,index=Math.abs(Number(state.program.index)||0),position=index%total;
    const cycle=Math.floor(index/total)+1;
    const tpl=workoutTemplate(state.program);
    $("#cycleLabel").textContent=`Cycle ${cycle} • Semaine ${tpl.week}/4 • Jour ${tpl.day}/6`;
    $("#cycleProgressText").textContent=`${position+1} / 24`;
    $("#cycleProgressBar").style.width=`${Math.round((position+1)/total*100)}%`;
  }

  function render(){
    const tpl=workoutTemplate(state.program);
    $("#sessionLabel").textContent=`Semaine ${tpl.week} • Jour ${tpl.day}/6`;
    $("#sessionName").textContent=tpl.name;
    $("#sessionFocus").textContent=tpl.focus;
    $("#dashDuration").textContent="~20 min";
    $("#dailyCoachText").textContent=coachRecommendation(tpl);
    $("#readiness").textContent=tpl.intensity==="léger"?"LÉGER":"PROGRESSION";
    $("#readiness").classList.toggle("light-day",tpl.intensity==="léger");
    renderCycle();
    renderMilestones();
  }

  on("#quickStart","click",()=>launchSession(programSession(state.program),false));
  on("#openMilestones","click",()=>openLayer("#milestoneModal"));
  on("#closeMilestoneModal","click",()=>closeLayer("#milestoneModal"));

  return {render};
}
