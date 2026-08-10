
import {$,$$,on,openLayer,closeLayer} from "../helpers.js";
import {createBackup,validateBackup,downloadJson} from "../utils/backup.js";
import {replaceState} from "../core/state.js";

const AXES={
  push:{label:"Push",ids:["pushups","pike"],hint:"Pecs · épaules · triceps"},
  legs:{label:"Jambes",ids:["squat","reverse_lunge"],hint:"Quadriceps · fessiers"},
  core:{label:"Core",ids:["plank","dead_bug"],hint:"Gainage · contrôle"},
  back:{label:"Dos",ids:["superman_pull","reverse_snow_angel"],hint:"Chaîne postérieure · posture"}
};

const RECORD_IDS=["pushups","plank","squat","reverse_lunge","pike","reverse_crunch","superman_pull","single_leg_glute_bridge"];
const TARGET_IDS=["pushups","pike","squat","reverse_lunge","plank","dead_bug","superman_pull","reverse_snow_angel"];

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const round1=n=>Math.round(n*10)/10;
const pctText=n=>`${n>=0?"+":""}${Math.round(n)}%`;
const uid=()=>globalThis.crypto?.randomUUID?.()||`g-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function isoDay(date=new Date()){ return date.toISOString().slice(0,10) }
function exerciseUnit(ex,value){
  if(value==null||value==="")return"—";
  return `${Math.round(value)}${ex?.mode==="time"?" s":ex?.perSide?" / côté":""}`;
}
function titleForSessions(n){
  if(n>=60)return"Machine";
  if(n>=36)return"Athlétique";
  if(n>=18)return"Solide";
  if(n>=6)return"Régulier";
  return"Démarrage";
}

export function initProfileProgress({state,save,EXERCISES,dayKey,level,coachText,refresh}) {
  const counted=()=>state.history.filter(h=>h.counted);
  const programHistory=()=>counted().filter(h=>h.sessionKey);
  const oldestHistory=()=>[...counted()].reverse();

  function earliestActual(id){
    for(const h of oldestHistory()){
      const set=(h.sets||[]).find(s=>s.id===id&&!s.skipped&&Number(s.actual)>0);
      if(set)return Number(set.actual);
    }
    return null;
  }
  function latestActual(id){
    for(const h of state.history){
      const set=(h.sets||[]).find(s=>s.id===id&&!s.skipped&&Number(s.actual)>0);
      if(set)return Number(set.actual);
    }
    return null;
  }
  function currentValue(id){
    const best=Number(state.bests[id])||0;
    if(best>0)return best;
    const latest=latestActual(id);
    if(latest)return latest;
    return Number(state.targets[id])||Number(EXERCISES[id]?.base)||1;
  }

  function ensureBaseline(){
    state.progressBaseline=state.progressBaseline||{createdAt:"",values:{}};
    state.progressBaseline.values=state.progressBaseline.values||{};
    const anchors=[...new Set(Object.values(AXES).flatMap(a=>a.ids))];
    let changed=false;
    for(const id of anchors){
      if(!(Number(state.progressBaseline.values[id])>0)){
        state.progressBaseline.values[id]=earliestActual(id)||Number(state.targets[id])||Number(EXERCISES[id]?.base)||1;
        changed=true;
      }
    }
    if(!state.progressBaseline.createdAt){
      state.progressBaseline.createdAt=oldestHistory()[0]?.date||new Date().toISOString();
      changed=true;
    }
    state.profileMeta=state.profileMeta||{nickname:"",startedAt:""};
    if(!state.profileMeta.startedAt){
      state.profileMeta.startedAt=state.progressBaseline.createdAt;
      changed=true;
    }
    if(changed)save(state);
  }

  function axisIndex(axis){
    const ratios=axis.ids.map(id=>{
      const base=Number(state.progressBaseline.values[id])||currentValue(id)||1;
      return currentValue(id)/base;
    }).filter(Number.isFinite);
    if(!ratios.length)return 100;
    return Math.round(ratios.reduce((a,b)=>a+b,0)/ratios.length*100);
  }
  function indices(){
    const out={};
    for(const [key,axis] of Object.entries(AXES))out[key]=axisIndex(axis);
    const physical=Math.round(Object.values(out).reduce((a,b)=>a+b,0)/Object.values(out).length);
    const cutoff=Date.now()-28*86400000;
    const days=new Set(counted().filter(h=>new Date(h.date).getTime()>=cutoff).map(h=>h.day)).size;
    out.regularity=Math.round(clamp(days/24*100,0,100));
    out.physical=physical;
    return out;
  }

  function totals(){
    let reps=0,minutes=0;
    for(const h of state.history){
      minutes+=(Number(h.duration)||0)/60;
      for(const set of h.sets||[])if(!set.skipped&&set.mode==="reps")reps+=Number(set.actual)||0;
    }
    const scored=counted().filter(h=>Number.isFinite(Number(h.score)));
    const avgScore=scored.length?Math.round(scored.reduce((a,h)=>a+Number(h.score||0),0)/scored.length):0;
    return {reps,minutes:Math.round(minutes),avgScore};
  }

  function cycleInfo(){
    const completed=Math.max(0,Number(state.program.index)||0);
    const cycle=Math.floor(completed/24)+1;
    const position=completed%24;
    const week=Math.floor(position/6)+1;
    const day=position%6+1;
    return {completed,cycle,position,week,day};
  }

  function recentCycleRecords(){
    const c=cycleInfo();
    return programHistory().slice(0,c.position);
  }
  function previousCycleRecords(){
    const c=cycleInfo();
    if(c.completed<24)return[];
    return programHistory().slice(c.position,c.position+24);
  }

  function cycleStats(records){
    if(!records.length)return{score:null,minutes:0,reps:0};
    let reps=0;
    for(const h of records)for(const set of h.sets||[])if(!set.skipped&&set.mode==="reps")reps+=Number(set.actual)||0;
    return{
      score:Math.round(records.reduce((a,h)=>a+Number(h.score||0),0)/records.length),
      minutes:Math.round(records.reduce((a,h)=>a+Number(h.duration||0),0)/60),
      reps
    };
  }

  function activityDays(){
    const map=new Map();
    for(const h of counted())map.set(h.day,(map.get(h.day)||0)+1);
    const days=[];
    for(let i=41;i>=0;i--){
      const d=new Date(Date.now()-i*86400000),key=isoDay(d),count=map.get(key)||0;
      days.push({key,count,date:d});
    }
    return days;
  }

  function bodyData(){
    const ms=state.measurements.filter(m=>m&&m.date);
    const first=ms[0]||{};
    const latest=ms[ms.length-1]||{};
    const currentWeight=Number(latest.weightKg)||Number(state.profile.weightKg)||null;
    const currentWaist=Number(latest.waistCm)||null;
    const firstWeight=Number(first.weightKg)||currentWeight;
    const firstWaist=Number(first.waistCm)||currentWaist;
    return{
      first,latest,currentWeight,currentWaist,
      weightDelta:currentWeight&&firstWeight?round1(currentWeight-firstWeight):null,
      waistDelta:currentWaist&&firstWaist?round1(currentWaist-firstWaist):null
    };
  }

  function initials(){
    const name=(state.profileMeta.nickname||"Mimi Muscu").trim();
    return name.split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join("")||"MM";
  }

  function performanceNarrative(idx){
    const physical=Object.entries(AXES).map(([key,a])=>({key,label:a.label,value:idx[key],gain:idx[key]-100}));
    physical.sort((a,b)=>b.gain-a.gain);
    if(state.sessions<3)return"Ton profil démarre à l’indice 100. Les barres vont devenir plus parlantes après quelques séances.";
    const best=physical[0],low=physical[physical.length-1];
    if(best.gain>=8 && best.gain-low.gain>=8)return`${best.label} est ton axe qui progresse le plus : ${pctText(best.gain)} depuis ton niveau de départ.`;
    if(idx.regularity>=85)return"Ta régularité est ton gros point fort en ce moment. Continue à protéger les jours légers.";
    return"Progression homogène : laisse l’adaptation automatique faire monter les objectifs progressivement.";
  }

  function axisCards(idx,compact=false){
    return Object.entries(AXES).map(([key,a])=>{
      const value=idx[key],gain=value-100;
      const width=clamp((value-70)/80*100,6,100);
      return `<div class="axis-row ${compact?"compact":""}">
        <div class="axis-head"><div><strong>${a.label}</strong><small>${a.hint}</small></div><b>${value}</b></div>
        <div class="axis-track"><span style="width:${width}%"></span><i style="left:${clamp((100-70)/80*100,0,100)}%"></i></div>
        <div class="axis-foot"><span>100 = départ</span><em class="${gain>=0?"up":"down"}">${pctText(gain)}</em></div>
      </div>`;
    }).join("");
  }

  function recordCards(){
    const rows=RECORD_IDS.map(id=>({id,e:EXERCISES[id],best:Number(state.bests[id])||0,first:earliestActual(id)}))
      .filter(x=>x.e&&x.best>0)
      .sort((a,b)=>{
        const ag=a.first?b.best/b.first:0,bg=b.first?a.best/a.first:0;
        return bg-ag;
      })
      .slice(0,6);
    if(!rows.length)return`<div class="empty-state">Tes premiers records apparaîtront après quelques séances.</div>`;
    return rows.map(x=>`<div class="record-tile">
      <span>PR</span><strong>${exerciseUnit(x.e,x.best)}</strong><small>${x.e.name}</small>
    </div>`).join("");
  }

  function sinceStartCards(){
    const rows=RECORD_IDS.map(id=>{
      const e=EXERCISES[id],first=earliestActual(id),current=Number(state.bests[id])||latestActual(id);
      if(!e||!first||!current)return null;
      return{id,e,first,current,gain:(current/first-1)*100};
    }).filter(Boolean).sort((a,b)=>b.gain-a.gain).slice(0,4);
    if(!rows.length)return`<div class="empty-state">Il faut au moins deux repères de performance pour comparer le départ à aujourd’hui.</div>`;
    return rows.map(x=>`<div class="before-after-card">
      <small>${x.e.name}</small>
      <div><span>${exerciseUnit(x.e,x.first)}</span><b>→</b><strong>${exerciseUnit(x.e,x.current)}</strong></div>
      <em>${pctText(x.gain)}</em>
    </div>`).join("");
  }

  function goalCurrent(goal){
    if(goal.type==="exercise")return Number(state.bests[goal.exerciseId])||0;
    const body=bodyData();
    if(goal.type==="weight")return body.currentWeight;
    if(goal.type==="waist")return body.currentWaist;
    return null;
  }
  function goalUnit(goal){
    if(goal.type==="weight")return"kg";
    if(goal.type==="waist")return"cm";
    const e=EXERCISES[goal.exerciseId];
    return e?.mode==="time"?"s":e?.perSide?"/ côté":"reps";
  }
  function goalProgress(goal){
    const current=Number(goalCurrent(goal)),target=Number(goal.target),start=Number(goal.startValue);
    if(!Number.isFinite(current)||!Number.isFinite(target)||!Number.isFinite(start)||target===start)return current===target?100:0;
    const progress=target>start?(current-start)/(target-start):(start-current)/(start-target);
    return Math.round(clamp(progress*100,0,100));
  }
  function renderGoals(){
    const box=$("#profileGoals");
    if(!box)return;
    if(!state.goals.length){
      box.innerHTML=`<div class="empty-state">Ajoute un objectif perso : un record, un poids ou un tour de taille.</div>`;
      return;
    }
    box.innerHTML=state.goals.map(g=>{
      const current=goalCurrent(g),p=goalProgress(g),unit=goalUnit(g);
      const label=g.type==="exercise"?(EXERCISES[g.exerciseId]?.name||"Exercice"):g.type==="weight"?"Poids":"Tour de taille";
      const format=v=>v==null?"—":`${round1(Number(v))} ${unit}`;
      return `<div class="goal-card">
        <div class="goal-top"><div><small>${label}</small><strong>${format(current)} → ${format(g.target)}</strong></div><button data-delete-goal="${g.id}">×</button></div>
        <div class="goal-track"><span style="width:${p}%"></span></div><em>${p}%</em>
      </div>`;
    }).join("");
    $$("[data-delete-goal]").forEach(b=>b.addEventListener("click",()=>{
      state.goals=state.goals.filter(g=>g.id!==b.dataset.deleteGoal);save(state);renderGoals();
    }));
  }

  function renderActivity(){
    const days=activityDays(),active=days.filter(x=>x.count).length;
    $("#activityHeatmap").innerHTML=days.map(x=>`<i class="heat-${Math.min(3,x.count)}" title="${x.date.toLocaleDateString("fr-FR")}"></i>`).join("");
    $("#activityCaption").textContent=`${active} jours actifs sur les 42 derniers jours`;
    const last7=days.slice(-7).filter(x=>x.count).length;
    $("#weeklyConsistency").textContent=`${last7}/6`;
  }

  function renderCycleProfile(){
    const c=cycleInfo(),current=cycleStats(recentCycleRecords()),previous=cycleStats(previousCycleRecords());
    $("#profileCycleTitle").textContent=`Cycle ${c.cycle} · Semaine ${c.week}/4`;
    $("#profileCycleCount").textContent=`${c.position}/24`;
    $("#profileCycleDots").innerHTML=Array.from({length:24},(_,i)=>`<i class="${i<c.position?"done":i===c.position?"next":""}"></i>`).join("");
    $("#cycleCurrentStats").innerHTML=`
      <div><strong>${current.score??"—"}</strong><span>score moyen</span></div>
      <div><strong>${current.minutes}</strong><span>minutes</span></div>
      <div><strong>${current.reps}</strong><span>répétitions</span></div>`;
    if(previous.score!=null){
      $("#lastCycleReport").classList.remove("hidden");
      $("#lastCycleReport").innerHTML=`<span class="eyebrow">DERNIER CYCLE</span>
        <strong>${previous.score}/100 de moyenne · ${previous.minutes} min · ${previous.reps} reps</strong>
        <p>${c.position?`Tu es déjà reparti sur le cycle ${c.cycle}.`:`Cycle terminé : le suivant repart avec tes objectifs adaptés.`}</p>`;
    }else $("#lastCycleReport").classList.add("hidden");
  }

  function renderBody(){
    const b=bodyData();
    const delta=(v,unit)=>v==null?"Pas encore de comparaison":`${v>0?"+":""}${v} ${unit} depuis la première mesure`;
    $("#profileBodySummary").innerHTML=`
      <div><small>Poids</small><strong>${b.currentWeight??"—"} <em>${b.currentWeight?"kg":""}</em></strong><span>${delta(b.weightDelta,"kg")}</span></div>
      <div><small>Tour de taille</small><strong>${b.currentWaist??"—"} <em>${b.currentWaist?"cm":""}</em></strong><span>${delta(b.waistDelta,"cm")}</span></div>`;
    $("#bodySummary").innerHTML=`<div><strong>${b.currentWeight??"—"}</strong><span>kg actuel</span></div><div><strong>${b.currentWaist??"—"}</strong><span>cm taille</span></div>`;
    const weights=state.measurements.filter(m=>Number(m.weightKg)).slice(-24);
    if(weights.length){
      const vals=weights.map(m=>Number(m.weightKg)),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(.5,max-min);
      $("#weightChart").innerHTML=weights.map(m=>`<div class="bar" style="height:${18+(Number(m.weightKg)-min)/range*62}px" title="${m.weightKg} kg"></div>`).join("");
    }else $("#weightChart").innerHTML=`<span class="muted" style="font-size:11px">Ajoute quelques mesures pour voir la courbe.</span>`;
  }

  function renderTargets(){
    $("#targets").innerHTML=TARGET_IDS.map(id=>{
      const e=EXERCISES[id];if(!e)return"";
      const current=Number(state.targets[id])||e.base,best=Number(state.bests[id])||0;
      return `<div class="adaptive-target">
        <div><strong>${e.name}</strong><small>${e.primary}</small></div>
        <div><b>${exerciseUnit(e,current)}</b><span>objectif</span></div>
        <div><b>${best?exerciseUnit(e,best):"—"}</b><span>record</span></div>
      </div>`;
    }).join("");
  }

  function renderHistory(){
    const list=state.history.slice(0,24);
    $("#history").innerHTML=list.length?list.map(h=>`<div class="history-item rich">
      <div><strong>${h.sessionName||"Séance"}</strong><small>${new Date(h.date).toLocaleDateString("fr-FR",{day:"2-digit",month:"short"})}</small></div>
      <div><b>${h.score}/100</b><small>${Math.round((h.duration||0)/60)} min · +${h.xp} XP</small></div>
    </div>`).join(""):`<span class="muted">Aucune séance.</span>`;
  }

  function renderProfile(idx){
    const c=cycleInfo(),t=totals(),lvl=level(),xpIn=state.xp%500;
    const nickname=(state.profileMeta.nickname||"Mimi Athlete").trim();
    $("#profileAvatar").textContent=initials();
    $("#profileNickname").textContent=nickname;
    $("#profileTitle").textContent=titleForSessions(state.sessions);
    $("#profileLevel").textContent=`LV ${lvl}`;
    $("#profileXpLabel").textContent=`${xpIn} / 500 XP vers LV ${lvl+1}`;
    $("#profileXpBar").style.width=`${Math.round(xpIn/500*100)}%`;
    $("#profileIndex").textContent=idx.physical;
    $("#profileIndexDelta").textContent=pctText(idx.physical-100);
    $("#profileIndexDelta").className=idx.physical>=100?"positive":"negative";
    $("#profileAxes").innerHTML=axisCards(idx,true);
    $("#profileNarrative").textContent=performanceNarrative(idx);
    $("#profileSessions").textContent=state.sessions;
    $("#profileStreak").textContent=state.streak;
    $("#profileRegularity").textContent=`${idx.regularity}%`;
    $("#profileTotalReps").textContent=t.reps.toLocaleString("fr-FR");
    $("#profileRecords").innerHTML=recordCards();
    $("#profileSinceStart").innerHTML=sinceStartCards();
    renderActivity();renderCycleProfile();renderGoals();renderBody();
  }

  function renderProgress(idx){
    const t=totals();
    $("#sessions").textContent=state.sessions;
    $("#xp").textContent=state.xp.toLocaleString("fr-FR");
    $("#streak").textContent=state.streak;
    $("#totalReps").textContent=t.reps.toLocaleString("fr-FR");
    $("#totalMinutes").textContent=t.minutes;
    $("#avgScore").textContent=t.avgScore?`${t.avgScore}`:"—";
    $("#progressAxes").innerHTML=axisCards(idx);
    $("#progressNarrative").textContent=performanceNarrative(idx);
    $("#progressSinceStart").innerHTML=sinceStartCards();
    renderTargets();renderHistory();
  }

  // Profile edit
  on("#openEditProfile","click",()=>{
    $("#nickname").value=state.profileMeta.nickname||"";
    $("#age").value=state.profile.age||"";
    $("#height").value=state.profile.heightCm||"";
    $("#weight").value=state.profile.weightKg||"";
    openLayer("#profileEditModal");
  });
  on("#closeProfileEdit","click",()=>closeLayer("#profileEditModal"));
  on("#saveProfile","click",()=>{
    state.profileMeta.nickname=$("#nickname").value.trim();
    state.profile={age:$("#age").value,heightCm:$("#height").value,weightKg:$("#weight").value};
    if(state.profile.weightKg&&!state.measurements.length){
      state.measurements.push({date:new Date().toISOString(),weightKg:Number(state.profile.weightKg),waistCm:null,note:"Mesure initiale"});
    }
    save(state);closeLayer("#profileEditModal");refresh();
  });

  // Measurements
  on("#addMeasurement","click",()=>{
    $("#measureWeight").value=state.profile.weightKg||"";
    $("#measureWaist").value="";
    $("#measureNote").value="";
    openLayer("#measurementModal");
  });
  on("#closeMeasurementModal","click",()=>closeLayer("#measurementModal"));
  on("#saveMeasurement","click",()=>{
    const weight=Number($("#measureWeight").value),waist=Number($("#measureWaist").value);
    if(!weight&&!waist){alert("Ajoute au moins le poids ou le tour de taille.");return}
    state.measurements.push({date:new Date().toISOString(),weightKg:weight||null,waistCm:waist||null,note:$("#measureNote").value.trim()});
    state.measurements=state.measurements.slice(-180);
    if(weight)state.profile.weightKg=String(weight);
    save(state);closeLayer("#measurementModal");refresh();
  });

  // Personal goals
  function fillGoalExercises(){
    $("#goalExercise").innerHTML=Object.entries(EXERCISES)
      .filter(([,e])=>e.quiet&&e.equipment==="none")
      .sort((a,b)=>a[1].name.localeCompare(b[1].name,"fr"))
      .map(([id,e])=>`<option value="${id}">${e.name}</option>`).join("");
  }
  function syncGoalForm(){
    const type=$("#goalType").value;
    $("#goalExerciseWrap").classList.toggle("hidden",type!=="exercise");
    $("#goalUnit").textContent=type==="weight"?"kg":type==="waist"?"cm":"";
    $("#goalTarget").step=type==="exercise"?"1":"0.1";
  }
  on("#addGoal","click",()=>{fillGoalExercises();$("#goalType").value="exercise";$("#goalTarget").value="";syncGoalForm();openLayer("#goalModal")});
  on("#closeGoalModal","click",()=>closeLayer("#goalModal"));
  on("#goalType","change",syncGoalForm);
  on("#saveGoal","click",()=>{
    const type=$("#goalType").value,target=Number($("#goalTarget").value);
    if(!(target>0)){alert("Entre un objectif valide.");return}
    let startValue=null,exerciseId=null;
    if(type==="exercise"){
      exerciseId=$("#goalExercise").value;
      startValue=Number(state.bests[exerciseId])||0;
    }else{
      const b=bodyData();
      startValue=type==="weight"?b.currentWeight:b.currentWaist;
      if(startValue==null){alert("Ajoute d’abord une mesure actuelle.");return}
    }
    state.goals.push({id:uid(),type,exerciseId,target,startValue,createdAt:new Date().toISOString()});
    state.goals=state.goals.slice(-12);
    save(state);closeLayer("#goalModal");renderGoals();
  });

  on("#autoSuggest","change",()=>{state.preferences.autoSuggest=$("#autoSuggest").checked;save(state)});

  // Backup / ChatGPT
  on("#exportBackup","click",()=>{
    const backup=createBackup(state);state.backupMeta.lastExportAt=backup.exported_at;save(state);
    downloadJson(`mimi-muscu-backup-${new Date().toISOString().slice(0,10)}.json`,backup);
    if($("#backupStatus"))$("#backupStatus").textContent="Sauvegarde exportée ✓";
  });
  on("#importBackup","click",()=>$("#backupFileInput").click());
  on("#backupFileInput","change",async()=>{
    const file=$("#backupFileInput").files?.[0];if(!file)return;
    try{
      const imported=validateBackup(JSON.parse(await file.text()));
      if(!confirm("Remplacer toutes les données locales par cette sauvegarde ?"))return;
      replaceState(imported);location.reload();
    }catch(error){alert(error.message||"Sauvegarde invalide.")}
  });
  on("#openChat","click",async()=>{
    try{await navigator.clipboard.writeText($("#coachPrompt").value)}catch(_){}
    window.open("https://chatgpt.com/","_blank");
  });

  function render(){
    ensureBaseline();
    const idx=indices();
    $("#homeLevel").textContent=`LV ${level()}`;
    const td=state.history.filter(h=>h.day===dayKey()).length;
    $("#todayText").textContent=td?`${td} séance${td>1?"s":""} aujourd’hui.`:"Aucune séance terminée.";
    $("#redoSession").classList.toggle("hidden",!td);
    if($("#autoSuggest"))$("#autoSuggest").checked=state.preferences.autoSuggest!==false;
    renderProfile(idx);renderProgress(idx);
    $("#coachPrompt").value=coachText();
  }
  return {render};
}
