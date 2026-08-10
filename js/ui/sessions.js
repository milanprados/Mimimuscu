
import {$,$$,on,openLayer,closeLayer} from "../helpers.js";

export function initSessions({
  state,save,EXERCISES,workoutTemplate,LEVEL_META,
  richerSessionToFile,validateImportedSession,validateRichImportedSession,
  launchSession,launchProgram,refresh
}) {
  let customEditingId=null;
  let customWorking={name:"",description:"",exercises:[]};
  let plannerIds=[];
  let pickerMode="add";
  let pickerContext="planner";
  let replaceIndex=null;

  const uid=()=>crypto.randomUUID?crypto.randomUUID():`custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const customById=id=>state.customSessions.find(session=>session.id===id);
  const plannerTarget=id=>{
    const ex=EXERCISES[id],t=state.targets[id]??ex.base;
    return `${t}${ex.mode==="time"?" sec":ex.perSide?" / côté":" reps"}`;
  };

  function renderCustomSessions(){
    const root=$("#customSessionList");
    if(!state.customSessions.length){
      root.innerHTML=`<div class="muted" style="font-size:12px">Aucune séance personnalisée pour l’instant.</div>`;
      return;
    }
    root.innerHTML=state.customSessions.map(session=>`
      <div class="custom-session">
        <button data-custom-start="${session.id}" style="background:none;color:white;text-align:left;padding:0">
          <strong>${session.name}</strong><small>${session.exercises.length} exos${session.description?` • ${session.description}`:""}</small>
        </button>
        <div class="custom-session-actions">
          <button data-custom-export="${session.id}" title="Exporter">⇩</button>
          <button data-custom-edit="${session.id}" title="Modifier">✎</button>
        </div>
      </div>`).join("");

    $$("[data-custom-start]").forEach(b=>b.addEventListener("click",()=>{const s=customById(b.dataset.customStart);if(s)launchSession(s,false)}));
    $$("[data-custom-edit]").forEach(b=>b.addEventListener("click",()=>openCustomEditor(b.dataset.customEdit)));
    $$("[data-custom-export]").forEach(b=>b.addEventListener("click",()=>{const s=customById(b.dataset.customExport);if(s)downloadSessionFile(s)}));
  }

  function openCustomEditor(id=null){
    customEditingId=id;
    const existing=id?customById(id):null;
    customWorking=existing?JSON.parse(JSON.stringify(existing)):{
      id:uid(),name:"Nouvelle séance",description:"",level:"custom",exercises:[]
    };
    $("#customEditorTitle").textContent=existing?"Modifier la séance":"Nouvelle séance";
    $("#customName").value=customWorking.name||"";
    $("#customDescription").value=customWorking.description||"";
    $("#deleteCustomSession").classList.toggle("hidden",!existing);
    renderCustomEditor();openLayer("#customEditor");
  }

  function closeCustomEditor(){closeLayer("#customEditor")}

  function renderCustomEditor(){
    $("#customEditorList").innerHTML=customWorking.exercises.map((item,index)=>{
      const ex=EXERCISES[item.id];
      return `<div class="custom-editor-row">
        <div class="order">${index+1}</div>
        <button data-custom-replace="${index}" style="background:none;color:white;text-align:left;padding:0">
          <strong>${ex.name}</strong><small>${ex.primary} • ${plannerTarget(item.id)}</small>
        </button>
        <div class="custom-editor-buttons">
          <button data-custom-up="${index}" ${index===0?"disabled":""}>↑</button>
          <button data-custom-down="${index}" ${index===customWorking.exercises.length-1?"disabled":""}>↓</button>
          <button class="delete" data-custom-delete="${index}">×</button>
        </div></div>
        ${index<customWorking.exercises.length-1?`<div class="custom-rest">Repos après :
          <input type="number" min="0" max="180" step="5" value="${item.restAfter??25}" data-custom-rest="${index}"> sec</div>`:""}`;
    }).join("");

    $$("[data-custom-up]").forEach(b=>b.addEventListener("click",()=>{const i=+b.dataset.customUp;[customWorking.exercises[i-1],customWorking.exercises[i]]=[customWorking.exercises[i],customWorking.exercises[i-1]];renderCustomEditor()}));
    $$("[data-custom-down]").forEach(b=>b.addEventListener("click",()=>{const i=+b.dataset.customDown;[customWorking.exercises[i+1],customWorking.exercises[i]]=[customWorking.exercises[i],customWorking.exercises[i+1]];renderCustomEditor()}));
    $$("[data-custom-delete]").forEach(b=>b.addEventListener("click",()=>{customWorking.exercises.splice(+b.dataset.customDelete,1);renderCustomEditor()}));
    $$("[data-custom-rest]").forEach(input=>input.addEventListener("change",()=>{const i=+input.dataset.customRest;customWorking.exercises[i].restAfter=Math.max(0,Math.min(180,+input.value||0))}));
    $$("[data-custom-replace]").forEach(b=>b.addEventListener("click",()=>{pickerContext="custom-replace";replaceIndex=+b.dataset.customReplace;openPicker()}));
  }

  function saveCustomEditor(){
    customWorking.name=$("#customName").value.trim()||"Séance personnalisée";
    customWorking.description=$("#customDescription").value.trim();
    customWorking.updatedAt=new Date().toISOString();
    customWorking.createdAt ||= new Date().toISOString();
    if(!customWorking.exercises.length){alert("Ajoute au moins un exercice.");return}
    const index=state.customSessions.findIndex(s=>s.id===customWorking.id);
    if(index>=0)state.customSessions[index]=customWorking;else state.customSessions.push(customWorking);
    save(state);closeCustomEditor();renderCustomSessions();refresh();
  }

  function downloadSessionFile(session){
    const payload=richerSessionToFile(session);
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=`${session.name.toLowerCase().replace(/[^a-z0-9à-ÿ]+/gi,"-").replace(/^-|-$/g,"")||"seance"}.mimi-muscu.json`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function importSessionFile(file){
    try{
      const raw=JSON.parse(await file.text());
      const session=raw.version>=2?validateRichImportedSession(raw):validateImportedSession(raw);
      state.customSessions.push(session);save(state);renderCustomSessions();refresh();alert(`Séance "${session.name}" importée.`);
    }catch(error){alert(error.message||"Impossible d’importer ce fichier.")}
    finally{$("#sessionFileInput").value=""}
  }

  const defaultPlannerIds=()=>{
    const ids=workoutTemplate(state.program).ids;
    return Array.isArray(ids)?[...ids]:[];
  };
  function loadPlanner(){
    const tpl=workoutTemplate(state.program),draft=state.sessionDraft;
    const valid=draft&&draft.templateKey===tpl.key&&draft.level===state.program.level;
    plannerIds=valid?[...draft.ids]:defaultPlannerIds();
  }
  function savePlannerDraft(){
    const tpl=workoutTemplate(state.program);
    state.sessionDraft={templateKey:tpl.key,level:state.program.level,ids:[...plannerIds]};
    save(state);
  }
  function renderPlanner(){
    const tpl=workoutTemplate(state.program),meta=LEVEL_META[state.program.level],split=Math.ceil(plannerIds.length/2);
    $("#plannerLabel").textContent=`Séance ${tpl.key} • ${meta.name}`;
    $("#plannerName").textContent=tpl.name;
    $("#plannerMeta").textContent=`${plannerIds.length} exercices principaux • ${tpl.focus}`;
    $("#plannerList").innerHTML=plannerIds.map((id,index)=>{
      const ex=EXERCISES[id],phase=index<split?"Bloc 1":"Bloc 2",rest=(index===split-1&&index<plannerIds.length-1)?45:25;
      return `<div class="planner-row">
        <div class="planner-order">${index+1}</div>
        <button class="planner-main" data-replace="${index}" style="background:none;color:white;text-align:left;padding:0">
          <strong>${ex.name}</strong><small>${phase} • ${ex.primary}</small><small class="planner-target">${plannerTarget(id)}</small>
        </button>
        <div class="planner-buttons">
          <button data-up="${index}" ${index===0?"disabled":""}>↑</button>
          <button data-down="${index}" ${index===plannerIds.length-1?"disabled":""}>↓</button>
          <button class="delete" data-delete="${index}">×</button>
        </div></div>${index<plannerIds.length-1?`<div class="planner-rest">Repos ${rest} s</div>`:""}`;
    }).join("")+`<button class="add-exercise" id="addExercise">＋ Ajouter un exercice</button>`;

    $$("[data-up]").forEach(b=>b.addEventListener("click",()=>{const i=+b.dataset.up;[plannerIds[i-1],plannerIds[i]]=[plannerIds[i],plannerIds[i-1]];savePlannerDraft();renderPlanner()}));
    $$("[data-down]").forEach(b=>b.addEventListener("click",()=>{const i=+b.dataset.down;[plannerIds[i+1],plannerIds[i]]=[plannerIds[i],plannerIds[i+1]];savePlannerDraft();renderPlanner()}));
    $$("[data-delete]").forEach(b=>b.addEventListener("click",()=>{if(plannerIds.length<=1)return;plannerIds.splice(+b.dataset.delete,1);savePlannerDraft();renderPlanner()}));
    $$("[data-replace]").forEach(b=>b.addEventListener("click",()=>{pickerContext="planner";pickerMode="replace";replaceIndex=+b.dataset.replace;openPicker()}));
    on("#addExercise","click",()=>{pickerContext="planner";pickerMode="add";replaceIndex=null;openPicker()});
  }
  function openPlanner(){loadPlanner();renderPlanner();openLayer("#planner")}
  function closePlanner(){closeLayer("#planner")}
  function openPicker(){$("#pickerSearch").value="";renderPicker();openLayer("#exercisePicker")}
  function closePicker(){closeLayer("#exercisePicker",{keepLocked:true})}
  function renderPicker(){
    const q=$("#pickerSearch").value.trim().toLowerCase();
    const entries=Object.entries(EXERCISES).filter(([,e])=>!q||`${e.name} ${e.primary} ${e.secondary}`.toLowerCase().includes(q)).sort((a,b)=>a[1].name.localeCompare(b[1].name,"fr"));
    $("#pickerList").innerHTML=entries.map(([id,e])=>`<button class="picker-card" data-pick="${id}">
      <img src="${e.images[0]}" alt=""><div><strong>${e.name}</strong><small>${e.primary} • ${plannerTarget(id)}</small></div><span>＋</span></button>`).join("");
    $$("[data-pick]").forEach(b=>b.addEventListener("click",()=>{
      const id=b.dataset.pick;
      if(pickerContext==="custom-add"){customWorking.exercises.push({id,restAfter:25});closePicker();renderCustomEditor();pickerContext="planner";return}
      if(pickerContext==="custom-replace"&&replaceIndex!==null){const cur=customWorking.exercises[replaceIndex]||{restAfter:25};customWorking.exercises[replaceIndex]={id,restAfter:cur.restAfter??25};closePicker();renderCustomEditor();pickerContext="planner";return}
      if(pickerMode==="replace"&&replaceIndex!==null)plannerIds[replaceIndex]=id;else plannerIds.push(id);
      savePlannerDraft();closePicker();renderPlanner();
    }));
  }

  on("#newCustomSession","click",()=>openCustomEditor());
  on("#closeCustomEditor","click",closeCustomEditor);
  on("#saveCustomSession","click",saveCustomEditor);
  on("#deleteCustomSession","click",()=>{
    if(!customEditingId)return;
    const session=customById(customEditingId);
    if(!confirm(`Supprimer "${session?.name||"cette séance"}" ?`))return;
    state.customSessions=state.customSessions.filter(s=>s.id!==customEditingId);
    save(state);closeCustomEditor();renderCustomSessions();refresh();
  });
  on("#customAddExercise","click",()=>{pickerContext="custom-add";replaceIndex=null;openPicker()});
  on("#importSessionBtn","click",()=>$("#sessionFileInput").click());
  on("#sessionFileInput","change",()=>{const file=$("#sessionFileInput").files?.[0];if(file)importSessionFile(file)});
  on("#showSessionFormat","click",()=>{
    $("#formatExample").textContent=JSON.stringify({
      app:"mimi-muscu",type:"workout-session",version:3,
      name:"Pecs express",description:"20 min, silencieux",level:"custom",
      blocks:[
        {type:"circuit",rounds:3,rest_between_exercises_sec:25,rest_between_rounds_sec:60,
         items:["pushups","pike","close_pushups"]},
        {type:"exercise",exercise_id:"plank",sets:1,rest_after_sec:0,target_override:45}
      ]
    },null,2);
    openLayer("#formatModal");
  });
  on("#closeFormatModal","click",()=>closeLayer("#formatModal"));
  on("#prepareSession","click",openPlanner);
  on("#closePlanner","click",closePlanner);
  on("#closePicker","click",closePicker);
  on("#pickerSearch","input",renderPicker);
  on("#resetPlanner","click",()=>{state.sessionDraft=null;save(state);plannerIds=defaultPlannerIds();renderPlanner()});
  on("#startPlannedSession","click",()=>{savePlannerDraft();closePlanner();launchProgram(false)});
  renderCustomSessions();

  return {renderCustomSessions,openPlanner};
}
