
import {$,on,openLayer,closeLayer} from "../helpers.js";
import {createBackup,validateBackup,downloadJson} from "../utils/backup.js";
import {replaceState} from "../core/state.js";

export function initProfileProgress({state,save,EXERCISES,dayKey,selectedDuration,level,coachText,refresh}) {
  on("#defaultDuration","change",()=>{state.preferences.defaultDuration=Number($("#defaultDuration").value);save(state);refresh()});
  on("#autoSuggest","change",()=>{state.preferences.autoSuggest=$("#autoSuggest").checked;save(state)});
  on("#saveProfile","click",()=>{
    state.profile={age:$("#age").value,heightCm:$("#height").value,weightKg:$("#weight").value};
    if(state.profile.weightKg&&!state.measurements.length)state.measurements.push({date:new Date().toISOString(),weightKg:Number(state.profile.weightKg),waistCm:null,note:"Mesure initiale"});
    save(state);refresh();
    $("#saveProfile").textContent="Enregistré ✓";setTimeout(()=>$("#saveProfile").textContent="Enregistrer",800);
  });
  on("#addMeasurement","click",()=>{
    $("#measureWeight").value=state.profile.weightKg||"";$("#measureWaist").value="";$("#measureNote").value="";
    openLayer("#measurementModal");
  });
  on("#closeMeasurementModal","click",()=>closeLayer("#measurementModal"));
  on("#saveMeasurement","click",()=>{
    const weight=Number($("#measureWeight").value),waist=Number($("#measureWaist").value);
    if(!weight&&!waist){alert("Ajoute au moins le poids ou le tour de taille.");return}
    state.measurements.push({date:new Date().toISOString(),weightKg:weight||null,waistCm:waist||null,note:$("#measureNote").value.trim()});
    state.measurements=state.measurements.slice(-120);if(weight)state.profile.weightKg=String(weight);
    save(state);closeLayer("#measurementModal");refresh();
  });
  on("#exportBackup","click",()=>{
    const backup=createBackup(state);
    state.backupMeta.lastExportAt=backup.exported_at;
    save(state);
    downloadJson(`mimi-muscu-backup-${new Date().toISOString().slice(0,10)}.json`,backup);
    if($("#backupStatus"))$("#backupStatus").textContent="Sauvegarde exportée ✓";
  });
  on("#importBackup","click",()=>$("#backupFileInput").click());
  on("#backupFileInput","change",async()=>{
    const file=$("#backupFileInput").files?.[0];
    if(!file)return;
    try{
      const raw=JSON.parse(await file.text());
      const imported=validateBackup(raw);
      if(!confirm("Remplacer toutes les données locales par cette sauvegarde ?"))return;
      replaceState(imported);
      location.reload();
    }catch(error){alert(error.message||"Sauvegarde invalide.")}
  });
  on("#openChat","click",async()=>{
    try{await navigator.clipboard.writeText($("#coachPrompt").value)}catch(_){}
    window.open("https://chatgpt.com/","_blank");
  });

  function render(){
    $("#homeLevel").textContent=`LV ${level()}`;
    $("#sessions").textContent=state.sessions;$("#xp").textContent=state.xp;$("#streak").textContent=state.streak;
    let total=0;state.history.forEach(h=>(h.sets||[]).forEach(set=>{if(!set.skipped&&set.mode==="reps")total+=set.actual||0}));$("#totalReps").textContent=total;
    $("#targets").innerHTML=Object.entries(EXERCISES).filter(([,e])=>e.quiet&&e.equipment==="none").slice(0,30).map(([id,e])=>
      `<div class="row"><span>${e.name}</span><strong>${state.targets[id]}${e.mode==="time"?" s":e.perSide?" / côté":""}</strong></div>`).join("");
    $("#history").innerHTML=state.history.length?state.history.map(h=>`<div class="history-item"><strong>${h.sessionName||"Séance"} • ${new Date(h.date).toLocaleDateString("fr-FR")}</strong><small>${h.score}/100 • +${h.xp} XP • ${Math.round((h.duration||0)/60)} min</small></div>`).join(""):`<span class="muted">Aucune séance.</span>`;
    const td=state.history.filter(h=>h.day===dayKey()).length;$("#todayText").textContent=td?`${td} séance${td>1?"s":""} aujourd’hui.`:"Aucune séance terminée.";$("#redoSession").classList.toggle("hidden",!td);
    $("#age").value=state.profile.age||"";$("#height").value=state.profile.heightCm||"";$("#weight").value=state.profile.weightKg||"";
    $("#defaultDuration").value=String(selectedDuration());$("#autoSuggest").checked=state.preferences.autoSuggest!==false;
    const ms=state.measurements,latest=ms[ms.length-1]||{};
    $("#bodySummary").innerHTML=`<div><strong>${latest.weightKg??state.profile.weightKg??"—"}</strong><span>kg actuel</span></div><div><strong>${latest.waistCm??"—"}</strong><span>cm taille</span></div>`;
    const weights=ms.filter(m=>m.weightKg).slice(-20);
    if(weights.length){const vals=weights.map(m=>m.weightKg),min=Math.min(...vals),max=Math.max(...vals),range=Math.max(.5,max-min);$("#weightChart").innerHTML=weights.map(m=>`<div class="bar" style="height:${22+(m.weightKg-min)/range*58}px" title="${m.weightKg} kg"></div>`).join("")}
    else $("#weightChart").innerHTML=`<span class="muted" style="font-size:11px">Ajoute quelques mesures pour voir la courbe.</span>`;
    $("#coachPrompt").value=coachText();
  }
  return {render};
}
