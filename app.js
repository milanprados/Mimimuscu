
import {EXERCISES,PROGRAMS,LEVEL_META,workoutTemplate,sessionToFile,validateImportedSession,MILESTONES,TEST_SESSION,EXERCISE_LOAD,MUSCLE_GROUPS,compressSessionForDuration,richerSessionToFile,validateRichImportedSession} from "./data.js";
import {load,save,dayKey} from "./state.js";
import {Engine} from "./engine.js";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],wait=ms=>new Promise(r=>setTimeout(r,ms));
const state=load(EXERCISES);let audioOn=true,flipTimer=null,reps=0,effort="good";
const level=()=>1+Math.floor(state.xp/500);const weight=()=>Number(state.profile.weightKg)||null;
const kcal=sec=>{const w=weight();if(!w)return null;return Math.round(4.5*3.5*w/200*(sec/60))};

function selectedDuration(){return Number(state.preferences.defaultDuration)||22}
function daysBetween(a,b){if(!a||!b)return Infinity;return Math.floor((new Date(b)-new Date(a))/86400000)}
function benchmarkDue(){
  const last=state.benchmark.lastDate;
  if(!last)return state.sessions>=6;
  return daysBetween(last,new Date().toISOString()) >= (state.benchmark.dueEveryDays||28);
}
function recentSessions(n=3){return state.history.filter(h=>h.counted).slice(0,n)}
function coachRecommendation(){
  const recent=recentSessions(3);
  if(!recent.length) return "Commence tranquillement : priorité à la technique et à la régularité. Trois séances propres valent mieux qu’une séance énorme.";
  const hardSets=recent.flatMap(h=>h.sets||[]).filter(s=>s.effort==="hard"&&!s.skipped).length;
  const total=recent.flatMap(h=>h.sets||[]).filter(s=>!s.skipped).length||1;
  if(hardSets/total>.45) return "Tes dernières séances étaient assez dures. Je garde le volume stable aujourd’hui et je privilégie une exécution propre.";
  const avgScore=recent.reduce((a,h)=>a+(h.score||0),0)/recent.length;
  if(avgScore>=92) return "Tu encaisses très bien le programme. Les objectifs vont monter doucement, sans rallonger inutilement la séance.";
  return "Rythme cohérent. Fais la séance prévue et vise surtout des répétitions propres : l’app ajustera la difficulté après.";
}
function milestoneProgress(m){
  const best=state.bests[m.exerciseId]||0;
  return Math.max(0,Math.min(100,Math.round(best/m.value*100)));
}
function muscleLoadForRecord(record){
  const totals=Object.fromEntries(MUSCLE_GROUPS.map(m=>[m,0]));
  for(const set of record?.sets||[]){
    if(set.skipped)continue;
    const load=EXERCISE_LOAD[set.id]||{};
    for(const [muscle,value] of Object.entries(load))totals[muscle]+=value;
  }
  return totals;
}
function adaptiveSessionBase(){
  const tpl=workoutTemplate(state.program);
  return {
    id:`program-${tpl.key}`,
    name:tpl.name,
    description:tpl.focus,
    level:state.program.level,
    exercises:tpl.ids.map((id,index)=>({id,restAfter:index===3?45:25}))
  };
}
function sessionForToday(){
  return compressSessionForDuration(adaptiveSessionBase(),selectedDuration());
}
function launchSessionObject(session,redo=false){
  openFocus();
  engine.start(redo,session);
}

function speak(t){if(!audioOn||!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="fr-FR";u.rate=1.04;speechSynthesis.speak(u)}
function tone(f=700){if(!audioOn)return;try{const c=new(AudioContext||webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=f;g.gain.value=.04;o.start();o.stop(c.currentTime+.08)}catch(_){}}
function clearFlip(){if(flipTimer)clearInterval(flipTimer);flipTimer=null}
function openFocus(){document.body.classList.add("lock");$("#focus").classList.remove("hidden")}
function closeFocus(){engine.stop();clearFlip();document.body.classList.remove("lock");$("#focus").classList.add("hidden")}
function header(item){$("#focusPhase").textContent=item?.phase||"";$("#focusStep").textContent=`${engine.i+1} / ${engine.plan.length}`;$("#focusXp").textContent=`LV ${level()} • ${state.xp} XP`}
function poses(ex){return `<div class="pose-grid"><div class="pose"><span>Départ</span><img src="${ex.images[0]}"></div><div class="pose"><span>Fin</span><img src="${ex.images[1]}"></div></div>`}
function exerciseView({item,ex,target,next}){clearFlip();header(item);reps=target;effort="good";$("#focusContent").innerHTML=`<div class="focus-name">${ex.name}</div><div class="focus-target">${target}<small>${ex.perSide?" / côté":" reps"}</small></div>${poses(ex)}<div class="tip">💡 ${ex.tips[0]}</div><div class="rep-row"><button id="minus">−</button><div><strong id="repVal">${target}</strong><small>réalisées</small></div><button id="plus">+</button></div><div class="effort"><button data-e="easy">Facile</button><button data-e="good" class="sel">Bien</button><button data-e="hard">Très dur</button></div><button class="primary-btn" id="done">J’ai fini</button><div class="secondary-row"><button class="ghost" id="skip">Passer l’exercice</button><button class="ghost" id="later">Plus tard</button></div><div class="muted" style="text-align:center;font-size:12px">Ensuite : ${next?EXERCISES[next.id].name:"Fin"}</div>`;
$("#minus").onclick=()=>{$("#repVal").textContent=reps=Math.max(0,reps-1)};$("#plus").onclick=()=>{$("#repVal").textContent=++reps};$$("[data-e]").forEach(b=>b.onclick=()=>{effort=b.dataset.e;$$("[data-e]").forEach(x=>x.classList.toggle("sel",x===b))});$("#done").onclick=()=>engine.completeReps(reps,effort);$("#skip").onclick=()=>engine.skip();$("#later").onclick=()=>engine.skip()}
function timerView({item,ex,target,next}){clearFlip();header(item);$("#focusContent").innerHTML=`<div class="focus-name">${ex.name}</div><div class="timer-visual" id="tv"><img class="start" src="${ex.images[0]}"><img class="end" src="${ex.images[1]}"><span class="timer-tag" id="tt">Départ</span><div class="timer-overlay"><strong id="time">${target}</strong></div></div><div class="tip">💡 ${ex.tips[0]}</div><button class="primary-btn" id="pause">Pause</button><div class="secondary-row"><button class="ghost" id="early">Terminer maintenant</button><button class="ghost" id="skipT">Passer l’exercice</button></div>`;
let sw=false;flipTimer=setInterval(()=>{sw=!sw;$("#tv")?.classList.toggle("swap",sw);if($("#tt"))$("#tt").textContent=sw?"Fin":"Départ"},1200);$("#pause").onclick=()=>engine.pause();$("#early").onclick=()=>engine.complete(true);$("#skipT").onclick=()=>engine.skip()}
function restView({seconds,next,nextEx}){clearFlip();header(engine.plan[engine.i]);$("#focusContent").innerHTML=`<div class="rest-screen"><div class="muted">Récupération</div><div class="rest-time" id="rest">${seconds}</div>${nextEx?`<div class="next-preview"><div class="muted" style="text-align:center">Prochain exercice</div><h3>${nextEx.name}</h3><div class="target">${engine.target(next.id,next)}${nextEx.mode==="time"?" sec":nextEx.perSide?" / côté":" reps"}</div><div class="preview-grid"><img src="${nextEx.images[0]}"><img src="${nextEx.images[1]}"></div><ul class="tips">${nextEx.tips.map(t=>`<li>${t}</li>`).join("")}</ul></div>`:""}</div><button class="ghost" id="skipRest">Passer le repos</button>`;speak(`Récupération. Prochain exercice ${nextEx?.name||"fin"}`);$("#skipRest").onclick=()=>engine.skipRest()}
async function countdown({item,ex,done}){clearFlip();header(item);$("#focusContent").innerHTML=`<div class="count-screen"><div class="muted">Prochain exercice</div><div class="focus-name">${ex.name}</div><div class="preview-grid" style="width:100%"><img src="${ex.images[0]}"><img src="${ex.images[1]}"></div><div class="count-num" id="count">3</div></div>`;speak(`Prochain exercice ${ex.name}`);for(const n of[3,2,1]){$("#count").textContent=n;tone(n===1?920:680);await wait(850)}done()}
function finished({xp,score,records,duration,record}){
  clearFlip();
  const cal=kcal(duration);
  const loads=muscleLoadForRecord(record);
  const sorted=Object.entries(loads).sort((a,b)=>b[1]-a[1]).filter(([,v])=>v>0).slice(0,4);
  const max=Math.max(1,...sorted.map(([,v])=>v));
  const topMuscles=sorted.map(([m,v])=>`${m} ${"█".repeat(Math.max(1,Math.round(v/max*8)))}${"░".repeat(Math.max(0,8-Math.round(v/max*8)))}`).join("<br>");

  const changes=[];
  for(const set of record.sets||[]){
    if(set.skipped)continue;
    const next=state.targets[set.id];
    if(next && next!==set.target)changes.push(`${EXERCISES[set.id].name}: ${set.target} → ${next}`);
  }

  if(record.sessionKey==="benchmark" || record.sessionName==="Test de progression"){
    state.benchmark.lastDate=new Date().toISOString();
    save(state);
  }

  $("#focusContent").innerHTML=`
    <div class="reward">
      <div class="muted">SÉANCE TERMINÉE</div>
      <div class="xp">+${xp} XP</div>
      <div class="reward-grid">
        <div><strong>${score}/100</strong><span>score</span></div>
        <div><strong>🔥 ${state.streak}</strong><span>streak</span></div>
        <div><strong>${Math.floor(duration/60)}:${String(duration%60).padStart(2,"0")}</strong><span>durée</span></div>
        <div><strong>${cal?`~${cal}`:"—"}</strong><span>kcal</span></div>
      </div>

      <div class="analysis-card">
        <h3>Charge musculaire</h3>
        <p>${topMuscles||"Séance légère"}</p>
      </div>

      <div class="analysis-card">
        <h3>Coach</h3>
        <p>${changes.length?`Progression appliquée : ${changes.slice(0,3).join(" • ")}.`:"Objectifs maintenus : continue à privilégier la technique."}</p>
        <p>${records.length?`🏆 ${records.length} nouveau${records.length>1?"x":""} record${records.length>1?"s":""}.`:""}</p>
      </div>

      <button class="primary-btn yellow-bg" id="finish">Terminer</button>
      <button class="ghost" id="askCoachAfter" style="margin-top:8px;width:100%">Demander au coach</button>
    </div>`;

  $("#finish").onclick=()=>{closeFocus();refresh();showTab("progress")};
  $("#askCoachAfter").onclick=async()=>{
    closeFocus();refresh();showTab("profile");
    try{await navigator.clipboard.writeText($("#coachPrompt").value)}catch(_){}
    window.open("https://chatgpt.com/","_blank");
  };
}
const engine=new Engine(state,{exercise:exerciseView,timer:timerView,rest:restView,countdown,finished,tick:v=>{$("#time")&&($("#time").textContent=v);$("#rest")&&($("#rest").textContent=v)},paused:p=>{$("#pause")&&($("#pause").textContent=p?"Reprendre":"Pause")}});
function showTab(t){$$("main section").forEach(s=>s.classList.add("hidden"));$(`#${t}Tab`).classList.remove("hidden");$$(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===t))}
$$(".tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$("#quickStart").onclick=()=>launchSessionObject(sessionForToday(),false);
$("#redoSession").onclick=()=>{openFocus();engine.start(true)};$("#exitFocus").onclick=()=>{if(confirm("Quitter la séance ?"))closeFocus()};$("#audio").onclick=()=>{$("#audio").textContent=(audioOn=!audioOn)?"🔊":"🔇"};
const cats=["Tous","Push","Épaules","Dos","Jambes","Fessiers","Core","Cardio","Full body"];let cat="Tous";let quietOnly=true;let noEquipmentOnly=true;
function renderChips(){$("#chips").innerHTML=`<button class="${quietOnly?"active":""}" id="quietFilter">🤫 Silencieux</button><button class="${noEquipmentOnly?"active":""}" id="equipmentFilter">Sans matériel</button>`+cats.map(c=>`<button class="${c===cat?"active":""}" data-c="${c}">${c}</button>`).join("");$("#quietFilter").onclick=()=>{quietOnly=!quietOnly;renderChips();renderExercises()};$("#equipmentFilter").onclick=()=>{noEquipmentOnly=!noEquipmentOnly;renderChips();renderExercises()};$$("[data-c]").forEach(b=>b.onclick=()=>{cat=b.dataset.c;renderChips();renderExercises()})}
function renderExercises(){const q=$("#search").value.toLowerCase();const list=Object.entries(EXERCISES).filter(([id,e])=>(cat==="Tous"||e.cat===cat)&&(!quietOnly||e.quiet)&&(!noEquipmentOnly||e.equipment==="none")&&(!q||`${e.name} ${e.primary} ${e.secondary} ${(e.aliases||[]).join(" ")}`.toLowerCase().includes(q))).sort((a,b)=>a[1].name.localeCompare(b[1].name,"fr"));$("#exerciseList").innerHTML=list.map(([id,e])=>`<button class="exercise-card" data-id="${id}"><img src="${e.images[0]}"><div><strong>${e.name}</strong><small>${e.primary} · ${e.secondary}</small><span class="tag">${e.level}</span><span class="tag">${e.quiet?"silencieux":"impact"}</span></div><span>›</span></button>`).join("");$$(".exercise-card").forEach(c=>c.onclick=()=>openGuide(c.dataset.id))}
$("#search").oninput=renderExercises;renderChips();renderExercises();
function openGuide(id){const e=EXERCISES[id];$("#modalTitle").textContent=e.name;$("#modalBody").innerHTML=`<div class="guide-images"><div><span>Départ</span><img src="${e.images[0]}"></div><div><span>Fin</span><img src="${e.images[1]}"></div></div><div class="guide-section"><h3>Muscles principaux</h3><p>${e.primary} • ${e.secondary}</p></div><div class="guide-section"><h3>Exécution</h3><ol>${e.tips.map(x=>`<li>${x}</li>`).join("")}</ol></div><div class="guide-section"><h3>Respiration</h3><p>${e.breathing}</p></div><div class="guide-section"><h3>Erreurs fréquentes</h3><ul>${e.mistakes.map(x=>`<li>${x}</li>`).join("")}</ul></div><div class="guide-section"><h3>Variantes</h3><p><span class="yellow">Plus facile :</span> ${e.easy}</p><p><span class="yellow">Plus difficile :</span> ${e.hard}</p></div>`;$("#modal").classList.remove("hidden");document.body.classList.add("lock")}
$("#closeModal").onclick=()=>{$("#modal").classList.add("hidden");document.body.classList.remove("lock")};


let customEditingId=null;
let customWorking={name:"",description:"",exercises:[]};
let pickerContext="planner";

function uid(){
  return crypto.randomUUID ? crypto.randomUUID() : `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function customById(id){
  return state.customSessions.find(session=>session.id===id);
}

function renderCustomSessions(){
  const root=$("#customSessionList");
  if(!state.customSessions.length){
    root.innerHTML=`<div class="muted" style="font-size:12px">Aucune séance personnalisée pour l’instant.</div>`;
    return;
  }

  root.innerHTML=state.customSessions.map(session=>`
    <div class="custom-session">
      <button data-custom-start="${session.id}" style="background:none;color:white;text-align:left;padding:0">
        <strong>${session.name}</strong>
        <small>${session.exercises.length} exos${session.description?` • ${session.description}`:""}</small>
      </button>
      <div class="custom-session-actions">
        <button data-custom-export="${session.id}" title="Exporter">⇩</button>
        <button data-custom-edit="${session.id}" title="Modifier">✎</button>
      </div>
    </div>
  `).join("");

  $$("[data-custom-start]").forEach(button=>button.onclick=()=>{
    const session=customById(button.dataset.customStart);
    if(!session)return;
    openFocus();
    engine.start(false,session);
  });

  $$("[data-custom-edit]").forEach(button=>button.onclick=()=>{
    openCustomEditor(button.dataset.customEdit);
  });

  $$("[data-custom-export]").forEach(button=>button.onclick=()=>{
    const session=customById(button.dataset.customExport);
    if(session) downloadSessionFile(session);
  });
}

function openCustomEditor(id=null){
  customEditingId=id;
  const existing=id?customById(id):null;
  customWorking=existing
    ? JSON.parse(JSON.stringify(existing))
    : {
        id:uid(),
        name:"Nouvelle séance",
        description:"",
        level:"custom",
        exercises:[]
      };

  $("#customEditorTitle").textContent=existing?"Modifier la séance":"Nouvelle séance";
  $("#customName").value=customWorking.name||"";
  $("#customDescription").value=customWorking.description||"";
  $("#deleteCustomSession").classList.toggle("hidden",!existing);

  renderCustomEditor();
  $("#customEditor").classList.remove("hidden");
  document.body.classList.add("lock");
}

function closeCustomEditor(){
  $("#customEditor").classList.add("hidden");
  document.body.classList.remove("lock");
}

function renderCustomEditor(){
  $("#customEditorList").innerHTML=customWorking.exercises.map((item,index)=>{
    const ex=EXERCISES[item.id];
    return `
      <div class="custom-editor-row">
        <div class="order">${index+1}</div>
        <button data-custom-replace="${index}" style="background:none;color:white;text-align:left;padding:0">
          <strong>${ex.name}</strong>
          <small>${ex.primary} • ${plannerTarget(item.id)}</small>
        </button>
        <div class="custom-editor-buttons">
          <button data-custom-up="${index}" ${index===0?"disabled":""}>↑</button>
          <button data-custom-down="${index}" ${index===customWorking.exercises.length-1?"disabled":""}>↓</button>
          <button class="delete" data-custom-delete="${index}">×</button>
        </div>
      </div>
      ${index<customWorking.exercises.length-1?`
        <div class="custom-rest">
          Repos après :
          <input type="number" min="0" max="180" step="5" value="${item.restAfter??25}" data-custom-rest="${index}">
          sec
        </div>`:""}
    `;
  }).join("");

  $$("[data-custom-up]").forEach(button=>button.onclick=()=>{
    const i=Number(button.dataset.customUp);
    [customWorking.exercises[i-1],customWorking.exercises[i]]=[customWorking.exercises[i],customWorking.exercises[i-1]];
    renderCustomEditor();
  });

  $$("[data-custom-down]").forEach(button=>button.onclick=()=>{
    const i=Number(button.dataset.customDown);
    [customWorking.exercises[i+1],customWorking.exercises[i]]=[customWorking.exercises[i],customWorking.exercises[i+1]];
    renderCustomEditor();
  });

  $$("[data-custom-delete]").forEach(button=>button.onclick=()=>{
    customWorking.exercises.splice(Number(button.dataset.customDelete),1);
    renderCustomEditor();
  });

  $$("[data-custom-rest]").forEach(input=>input.onchange=()=>{
    const i=Number(input.dataset.customRest);
    customWorking.exercises[i].restAfter=Math.max(0,Math.min(180,Number(input.value)||0));
  });

  $$("[data-custom-replace]").forEach(button=>button.onclick=()=>{
    pickerContext="custom-replace";
    replaceIndex=Number(button.dataset.customReplace);
    openPicker();
  });
}

function saveCustomEditor(){
  customWorking.name=$("#customName").value.trim()||"Séance personnalisée";
  customWorking.description=$("#customDescription").value.trim();
  customWorking.updatedAt=new Date().toISOString();
  customWorking.createdAt ||= new Date().toISOString();

  if(!customWorking.exercises.length){
    alert("Ajoute au moins un exercice.");
    return;
  }

  const index=state.customSessions.findIndex(s=>s.id===customWorking.id);
  if(index>=0) state.customSessions[index]=customWorking;
  else state.customSessions.push(customWorking);

  save(state);
  closeCustomEditor();
  renderCustomSessions();
}

function downloadSessionFile(session){
  const payload=richerSessionToFile(session);
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`${session.name.toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi,"-").replace(/^-|-$/g,"")||"seance"}.mimi-muscu.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function importSessionFile(file){
  try{
    const text=await file.text();
    const raw=JSON.parse(text);
    const session=(raw.version>=2?validateRichImportedSession(raw):validateImportedSession(raw));
    state.customSessions.push(session);
    save(state);
    renderCustomSessions();
    alert(`Séance "${session.name}" importée.`);
  }catch(error){
    alert(error.message||"Impossible d’importer ce fichier.");
  }finally{
    $("#sessionFileInput").value="";
  }
}

$("#newCustomSession").onclick=()=>openCustomEditor();
$("#closeCustomEditor").onclick=closeCustomEditor;
$("#saveCustomSession").onclick=saveCustomEditor;
$("#deleteCustomSession").onclick=()=>{
  if(!customEditingId)return;
  const session=customById(customEditingId);
  if(!confirm(`Supprimer "${session?.name||"cette séance"}" ?`))return;
  state.customSessions=state.customSessions.filter(s=>s.id!==customEditingId);
  save(state);
  closeCustomEditor();
  renderCustomSessions();
};

$("#customAddExercise").onclick=()=>{
  pickerContext="custom-add";
  replaceIndex=null;
  openPicker();
};

$("#importSessionBtn").onclick=()=>$("#sessionFileInput").click();
$("#sessionFileInput").onchange=()=>{
  const file=$("#sessionFileInput").files?.[0];
  if(file) importSessionFile(file);
};

$("#showSessionFormat").onclick=()=>{
  const example={
    app:"mimi-muscu",
    type:"workout-session",
    version:1,
    name:"Pecs express",
    description:"Séance courte, silencieuse, poids du corps",
    level:"custom",
    exercises:[
      {exercise_id:"pushups",rest_after_sec:25},
      {exercise_id:"pike",rest_after_sec:30},
      {exercise_id:"close_pushups",rest_after_sec:25},
      {exercise_id:"plank",rest_after_sec:0}
    ]
  };
  $("#formatExample").textContent=JSON.stringify(example,null,2);
  $("#formatModal").classList.remove("hidden");
  document.body.classList.add("lock");
};
$("#closeFormatModal").onclick=()=>{
  $("#formatModal").classList.add("hidden");
  document.body.classList.remove("lock");
};

let plannerIds=[];
let pickerMode="add";
let replaceIndex=null;

function defaultPlannerIds(){
  return [...workoutTemplate(state.program).ids];
}

function loadPlanner(){
  const tpl=workoutTemplate(state.program);
  const draft=state.sessionDraft;
  const valid=draft && draft.templateKey===tpl.key && draft.level===state.program.level;
  plannerIds=valid ? [...draft.ids] : defaultPlannerIds();
}

function savePlannerDraft(){
  const tpl=workoutTemplate(state.program);
  state.sessionDraft={
    templateKey:tpl.key,
    level:state.program.level,
    ids:[...plannerIds]
  };
  save(state);
}

function plannerTarget(id){
  const ex=EXERCISES[id];
  const t=state.targets[id]??ex.base;
  return `${t}${ex.mode==="time"?" sec":ex.perSide?" / côté":" reps"}`;
}

function renderPlanner(){
  const tpl=workoutTemplate(state.program);
  const meta=LEVEL_META[state.program.level];
  $("#plannerLabel").textContent=`Séance ${tpl.key} • ${meta.name}`;
  $("#plannerName").textContent=tpl.name;
  $("#plannerMeta").textContent=`${plannerIds.length} exercices principaux • ${tpl.focus}`;

  const split=Math.ceil(plannerIds.length/2);

  $("#plannerList").innerHTML=plannerIds.map((id,index)=>{
    const ex=EXERCISES[id];
    const phase=index<split?"Bloc 1":"Bloc 2";
    const rest=(index===split-1 && index<plannerIds.length-1)?45:25;
    return `
      <div class="planner-row">
        <div class="planner-order">${index+1}</div>
        <button class="planner-main" data-replace="${index}" style="background:none;color:white;text-align:left;padding:0">
          <strong>${ex.name}</strong>
          <small>${phase} • ${ex.primary}</small>
          <small class="planner-target">${plannerTarget(id)}</small>
        </button>
        <div class="planner-buttons">
          <button data-up="${index}" ${index===0?"disabled":""}>↑</button>
          <button data-down="${index}" ${index===plannerIds.length-1?"disabled":""}>↓</button>
          <button class="delete" data-delete="${index}">×</button>
        </div>
      </div>
      ${index<plannerIds.length-1?`<div class="planner-rest">Repos ${rest} s</div>`:""}
    `;
  }).join("") + `<button class="add-exercise" id="addExercise">＋ Ajouter un exercice</button>`;

  $$("[data-up]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.up);
    [plannerIds[i-1],plannerIds[i]]=[plannerIds[i],plannerIds[i-1]];
    savePlannerDraft();renderPlanner();
  });

  $$("[data-down]").forEach(b=>b.onclick=()=>{
    const i=Number(b.dataset.down);
    [plannerIds[i+1],plannerIds[i]]=[plannerIds[i],plannerIds[i+1]];
    savePlannerDraft();renderPlanner();
  });

  $$("[data-delete]").forEach(b=>b.onclick=()=>{
    if(plannerIds.length<=1)return;
    plannerIds.splice(Number(b.dataset.delete),1);
    savePlannerDraft();renderPlanner();
  });

  $$("[data-replace]").forEach(b=>b.onclick=()=>{
    pickerContext="planner";
    pickerMode="replace";
    replaceIndex=Number(b.dataset.replace);
    openPicker();
  });

  $("#addExercise").onclick=()=>{
    pickerContext="planner";
    pickerMode="add";
    replaceIndex=null;
    openPicker();
  };
}

function openPlanner(){
  loadPlanner();
  renderPlanner();
  $("#planner").classList.remove("hidden");
  document.body.classList.add("lock");
}

function closePlanner(){
  $("#planner").classList.add("hidden");
  document.body.classList.remove("lock");
}

function openPicker(){
  $("#pickerSearch").value="";
  renderPicker();
  $("#exercisePicker").classList.remove("hidden");
}

function closePicker(){
  $("#exercisePicker").classList.add("hidden");
}

function renderPicker(){
  const q=$("#pickerSearch").value.trim().toLowerCase();
  const entries=Object.entries(EXERCISES)
    .filter(([id,e])=>!q || `${e.name} ${e.primary} ${e.secondary}`.toLowerCase().includes(q))
    .sort((a,b)=>a[1].name.localeCompare(b[1].name,"fr"));

  $("#pickerList").innerHTML=entries.map(([id,e])=>`
    <button class="picker-card" data-pick="${id}">
      <img src="${e.images[0]}" alt="">
      <div>
        <strong>${e.name}</strong>
        <small>${e.primary} • ${plannerTarget(id)}</small>
      </div>
      <span>＋</span>
    </button>
  `).join("");

  $$("[data-pick]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.pick;

    if(pickerContext==="custom-add"){
      customWorking.exercises.push({id,restAfter:25});
      closePicker();
      renderCustomEditor();
      pickerContext="planner";
      return;
    }

    if(pickerContext==="custom-replace" && replaceIndex!==null){
      const current=customWorking.exercises[replaceIndex]||{restAfter:25};
      customWorking.exercises[replaceIndex]={id,restAfter:current.restAfter??25};
      closePicker();
      renderCustomEditor();
      pickerContext="planner";
      return;
    }

    if(pickerMode==="replace" && replaceIndex!==null) plannerIds[replaceIndex]=id;
    else plannerIds.push(id);
    savePlannerDraft();
    closePicker();
    renderPlanner();
  });
}

$("#prepareSession").onclick=openPlanner;
$("#sessionHero").onclick=e=>{
  if(e.target.closest("button"))return;
  openPlanner();
};
$("#closePlanner").onclick=closePlanner;
$("#closePicker").onclick=closePicker;
$("#pickerSearch").oninput=renderPicker;

$("#resetPlanner").onclick=()=>{
  state.sessionDraft=null;
  save(state);
  plannerIds=defaultPlannerIds();
  renderPlanner();
};

$("#startPlannedSession").onclick=()=>{
  savePlannerDraft();
  closePlanner();
  openFocus();
  engine.start(false);
};


$$("[data-duration]").forEach(button=>button.onclick=()=>{
  state.preferences.defaultDuration=Number(button.dataset.duration);
  save(state);refresh();
});

$("#defaultDuration").onchange=()=>{
  state.preferences.defaultDuration=Number($("#defaultDuration").value);
  save(state);refresh();
};
$("#autoSuggest").onchange=()=>{
  state.preferences.autoSuggest=$("#autoSuggest").checked;
  save(state);
};

function renderMilestones(){
  const top=MILESTONES.slice(0,3);
  $("#milestonePreview").innerHTML=top.map(m=>{
    const p=milestoneProgress(m);
    const best=state.bests[m.exerciseId]||0;
    return `<div class="milestone"><div class="milestone-top"><strong>${m.label}</strong><span>${best}/${m.value}</span></div><div class="milestone-bar"><div style="width:${p}%"></div></div></div>`
  }).join("");
  $("#milestoneList").innerHTML=MILESTONES.map(m=>{
    const p=milestoneProgress(m),best=state.bests[m.exerciseId]||0;
    return `<div class="card"><div class="milestone-top"><strong>${m.label}</strong><span>${p}%</span></div><div class="milestone-bar"><div style="width:${p}%"></div></div><p class="muted">${best} / ${m.value}</p></div>`
  }).join("");
}
$("#openMilestones").onclick=()=>{$("#milestoneModal").classList.remove("hidden");document.body.classList.add("lock")};
$("#closeMilestoneModal").onclick=()=>{$("#milestoneModal").classList.add("hidden");document.body.classList.remove("lock")};

$("#startBenchmark").onclick=()=>launchSessionObject(TEST_SESSION,false);

$("#addMeasurement").onclick=()=>{
  $("#measureWeight").value=state.profile.weightKg||"";
  $("#measureWaist").value="";
  $("#measureNote").value="";
  $("#measurementModal").classList.remove("hidden");document.body.classList.add("lock");
};
$("#closeMeasurementModal").onclick=()=>{$("#measurementModal").classList.add("hidden");document.body.classList.remove("lock")};
$("#saveMeasurement").onclick=()=>{
  const weight=Number($("#measureWeight").value),waist=Number($("#measureWaist").value);
  if(!weight&&!waist){alert("Ajoute au moins le poids ou le tour de taille.");return}
  state.measurements.push({
    date:new Date().toISOString(),
    weightKg:weight||null,
    waistCm:waist||null,
    note:$("#measureNote").value.trim()
  });
  state.measurements=state.measurements.slice(-120);
  if(weight)state.profile.weightKg=String(weight);
  save(state);
  $("#measurementModal").classList.add("hidden");document.body.classList.remove("lock");refresh();
};
$("#programLevel").onchange=()=>{
  state.program.level=$("#programLevel").value;
  state.program.index=0;
  state.sessionDraft=null;
  save(state);
  refresh()
};
$("#saveProfile").onclick=()=>{
  state.profile={age:$("#age").value,heightCm:$("#height").value,weightKg:$("#weight").value};
  if(state.profile.weightKg && !state.measurements.length){
    state.measurements.push({date:new Date().toISOString(),weightKg:Number(state.profile.weightKg),waistCm:null,note:"Mesure initiale"});
  }
  save(state);refresh();
  $("#saveProfile").textContent="Enregistré ✓";
  setTimeout(()=>$("#saveProfile").textContent="Enregistrer",800)
};
$("#openChat").onclick=async()=>{try{await navigator.clipboard.writeText($("#coachPrompt").value)}catch(_){}window.open("https://chatgpt.com/","_blank")};
function coachText(){
  const tpl=workoutTemplate(state.program),last=state.history[0];
  const out=[
    "Analyse ma progression et donne-moi des conseils courts, concrets et adaptés à mon objectif esthétique.",
    `Programme ${LEVEL_META[state.program.level].name}, séance prévue ${tpl.key} ${tpl.name}.`,
    `Profil: ${state.profile.age||"?"} ans, ${state.profile.heightCm||"?"} cm, ${state.profile.weightKg||"?"} kg.`,
    `Durée habituelle: ${selectedDuration()} min.`,
    `Streak: ${state.streak}. XP: ${state.xp}.`
  ];
  if(last){
    out.push(`Dernière séance: ${last.sessionName||"Séance"}, score ${last.score}/100, durée ${last.duration}s.`);
    for(const set of last.sets||[])out.push(set.skipped?`- ${set.name}: passé`:`- ${set.name}: ${set.actual}/${set.target} (${set.effort})`);
  }
  const latest=state.measurements[state.measurements.length-1];
  if(latest)out.push(`Dernière mesure: ${latest.weightKg||"?"} kg, tour de taille ${latest.waistCm||"?"} cm.`);
  out.push("Dis-moi quoi ajuster : exercices, volume, repos, difficulté, récupération ou nutrition générale.");
  return out.join("\n")
}
function refresh(){
  renderCustomSessions();
  renderMilestones();

  const tpl=workoutTemplate(state.program),meta=LEVEL_META[state.program.level];
  const today=sessionForToday();

  $("#homeLevel").textContent=`LV ${level()}`;
  $("#sessionLabel").textContent=`Séance ${tpl.key} • ${meta.name}`;
  $("#sessionName").textContent=today.name;
  $("#sessionFocus").textContent=today.description||tpl.focus;
  $("#dashDuration").textContent=`${selectedDuration()} min`;
  $("#dailyCoachText").textContent=coachRecommendation();

  $$("[data-duration]").forEach(b=>b.classList.toggle("active",Number(b.dataset.duration)===selectedDuration()));
  $("#defaultDuration").value=String(selectedDuration());
  $("#autoSuggest").checked=state.preferences.autoSuggest!==false;

  $("#benchmarkCard").classList.toggle("hidden",!benchmarkDue());

  $("#programName").textContent=meta.name;
  $("#programFrequency").textContent=`${meta.sessions} séances / semaine`;
  $("#programLevel").value=state.program.level;
  $("#rotationText").textContent=(PROGRAMS[state.program.level]||PROGRAMS.beginner).map(x=>x.key).join(" → ");

  $("#sessions").textContent=state.sessions;
  $("#xp").textContent=state.xp;
  $("#streak").textContent=state.streak;

  let total=0;
  state.history.forEach(h=>(h.sets||[]).forEach(set=>{if(!set.skipped&&set.mode==="reps")total+=set.actual||0}));
  $("#totalReps").textContent=total;

  $("#targets").innerHTML=Object.entries(EXERCISES).map(([id,e])=>
    `<div class="row"><span>${e.name}</span><strong>${state.targets[id]}${e.mode==="time"?" s":e.perSide?" / côté":""}</strong></div>`
  ).join("");

  $("#history").innerHTML=state.history.length
    ?state.history.map(h=>`<div class="history-item"><strong>${h.sessionName||"Séance"} • ${new Date(h.date).toLocaleDateString("fr-FR")}</strong><small>${h.score}/100 • +${h.xp} XP • ${Math.round((h.duration||0)/60)} min</small></div>`).join("")
    :`<span class="muted">Aucune séance.</span>`;

  const td=state.history.filter(h=>h.day===dayKey()).length;
  $("#todayText").textContent=td?`${td} séance${td>1?"s":""} aujourd’hui.`:"Aucune séance terminée.";
  $("#redoSession").classList.toggle("hidden",!td);

  $("#age").value=state.profile.age||"";
  $("#height").value=state.profile.heightCm||"";
  $("#weight").value=state.profile.weightKg||"";

  const ms=state.measurements;
  const latest=ms[ms.length-1]||{};
  const first=ms[0]||{};
  $("#bodySummary").innerHTML=`
    <div><strong>${latest.weightKg??state.profile.weightKg??"—"}</strong><span>kg actuel</span></div>
    <div><strong>${latest.waistCm??"—"}</strong><span>cm taille</span></div>
  `;
  const weights=ms.filter(m=>m.weightKg).slice(-20);
  if(weights.length){
    const vals=weights.map(m=>m.weightKg),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(.5,max-min);
    $("#weightChart").innerHTML=weights.map(m=>{
      const h=22+(m.weightKg-min)/range*58;
      return `<div class="bar" style="height:${h}px" title="${m.weightKg} kg"></div>`
    }).join("");
  }else $("#weightChart").innerHTML=`<span class="muted" style="font-size:11px">Ajoute quelques mesures pour voir la courbe.</span>`;

  $("#coachPrompt").value=coachText();
  save(state)
}

refresh();if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
