
import {$,$$,on,openLayer,closeLayer} from "../helpers.js";

export function initDictionary({EXERCISES}) {
  const cats=["Tous","Push","Épaules","Dos","Jambes","Fessiers","Core","Cardio","Full body"];
  let cat="Tous", quietOnly=true, noEquipmentOnly=true;

  function renderChips(){
    $("#chips").innerHTML=
      `<button class="${quietOnly?"active":""}" id="quietFilter">🤫 Silencieux</button>
       <button class="${noEquipmentOnly?"active":""}" id="equipmentFilter">Sans matériel</button>`+
      cats.map(c=>`<button class="${c===cat?"active":""}" data-c="${c}">${c}</button>`).join("");

    on("#quietFilter","click",()=>{quietOnly=!quietOnly;renderChips();renderExercises()});
    on("#equipmentFilter","click",()=>{noEquipmentOnly=!noEquipmentOnly;renderChips();renderExercises()});
    $$("[data-c]").forEach(b=>b.addEventListener("click",()=>{cat=b.dataset.c;renderChips();renderExercises()}));
  }

  function renderExercises(){
    const q=($("#search")?.value||"").toLowerCase();
    const list=Object.entries(EXERCISES)
      .filter(([,e])=>(cat==="Tous"||e.cat===cat)
        &&(!quietOnly||e.quiet)
        &&(!noEquipmentOnly||e.equipment==="none")
        &&(!q||`${e.name} ${e.primary} ${e.secondary} ${(e.aliases||[]).join(" ")}`.toLowerCase().includes(q)))
      .sort((a,b)=>a[1].name.localeCompare(b[1].name,"fr"));

    $("#exerciseList").innerHTML=list.map(([id,e])=>`
      <button class="exercise-card" data-id="${id}">
        <img src="${e.thumb||e.images[0]}" alt="" loading="lazy" decoding="async">
        <div>
          <strong>${e.name}</strong>
          <small>${e.primary} · ${e.secondary}</small>
          <span class="tag">${e.level}</span>
          <span class="tag">${e.quiet?"silencieux":"impact"}</span>
        </div><span>›</span>
      </button>`).join("");

    $$(".exercise-card").forEach(card=>card.addEventListener("click",()=>openGuide(card.dataset.id)));
  }

  function openGuide(id){
    const e=EXERCISES[id];
    $("#modalTitle").textContent=e.name;
    $("#modalBody").innerHTML=`
      <div class="guide-images">
        <div><span>Départ</span><img src="${e.thumb||e.images[0]}" alt="" loading="lazy" decoding="async"></div>
        <div><span>Fin</span><img src="${e.images[1]}" alt=""></div>
      </div>
      <div class="guide-section"><h3>Muscles principaux</h3><p>${e.primary} • ${e.secondary}</p></div>
      <div class="guide-section"><h3>Exécution</h3><ol>${(Array.isArray(e.tips)?e.tips:[]).map(x=>`<li>${x}</li>`).join("")}</ol></div>
      <div class="guide-section"><h3>Respiration</h3><p>${e.breathing}</p></div>
      <div class="guide-section"><h3>Erreurs fréquentes</h3><ul>${(Array.isArray(e.mistakes)?e.mistakes:[]).map(x=>`<li>${x}</li>`).join("")}</ul></div>
      <div class="guide-section"><h3>Variantes</h3><p><span class="yellow">Plus facile :</span> ${e.easy}</p><p><span class="yellow">Plus difficile :</span> ${e.hard}</p></div>`;
    openLayer("#modal");
  }

  on("#search","input",renderExercises);
  on("#closeModal","click",()=>closeLayer("#modal"));
  renderChips(); renderExercises();

  return {renderExercises};
}
