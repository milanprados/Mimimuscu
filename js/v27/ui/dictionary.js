
import {$,$$,on,openLayer,closeLayer} from "../helpers.js";

export function initDictionary({EXERCISES}) {
  const cats=["Tous","Push","Épaules","Dos","Jambes","Fessiers","Core","Cardio","Full body","Mobilité"];
  let cat="Tous",quietOnly=true,noEquipmentOnly=true;

  function renderChips(){
    $("#chips").innerHTML=
      `<button class="filter-chip utility ${quietOnly?"active":""}" id="quietFilter">Silencieux</button>
       <button class="filter-chip utility ${noEquipmentOnly?"active":""}" id="equipmentFilter">Sans matériel</button>`+
      cats.map(c=>`<button class="filter-chip ${c===cat?"active":""}" data-c="${c}">${c}</button>`).join("");

    on("#quietFilter","click",()=>{quietOnly=!quietOnly;renderChips();renderExercises()});
    on("#equipmentFilter","click",()=>{noEquipmentOnly=!noEquipmentOnly;renderChips();renderExercises()});
    $$("[data-c]").forEach(b=>b.addEventListener("click",()=>{
      cat=b.dataset.c;renderChips();renderExercises();
    }));
  }

  function renderExercises(){
    const q=($("#search")?.value||"").trim().toLowerCase();
    const list=Object.entries(EXERCISES)
      .filter(([,e])=>(cat==="Tous"||e.cat===cat)
        &&(!quietOnly||e.quiet)
        &&(!noEquipmentOnly||e.equipment==="none")
        &&(!q||`${e.name} ${e.primary} ${e.secondary} ${(e.aliases||[]).join(" ")}`.toLowerCase().includes(q)))
      .sort((a,b)=>a[1].name.localeCompare(b[1].name,"fr"));

    $("#exerciseCount").textContent=`${list.length} exercice${list.length>1?"s":""}`;
    $("#exerciseList").innerHTML=list.map(([id,e])=>`
      <button class="exercise-card" data-id="${id}">
        <div class="exercise-thumb"><img src="${e.thumb||e.images[0]}" alt="" loading="lazy" decoding="async"></div>
        <div class="exercise-copy">
          <div class="exercise-card-top">
            <strong>${e.name}</strong>
            <span class="exercise-arrow">↗</span>
          </div>
          <small>${e.primary}</small>
          <div class="exercise-meta">
            <span>${e.mode==="time"?"Temps":"Répétitions"}</span>
            <span>${e.cat}</span>
          </div>
        </div>
      </button>`).join("");

    $$(".exercise-card").forEach(card=>card.addEventListener("click",()=>openGuide(card.dataset.id)));
  }

  function openGuide(id){
    const e=EXERCISES[id];
    if(!e)return;
    $("#modalTitle").textContent=e.name;
    $("#modalBody").innerHTML=`
      <div class="guide-hero">
        <div class="guide-kicker">${e.cat} · ${e.mode==="time"?"Temps":"Répétitions"}</div>
        <div class="guide-images">
          <figure><span>Départ</span><img src="${e.images[0]}" alt=""></figure>
          <figure><span>Fin</span><img src="${e.images[1]}" alt=""></figure>
        </div>
        <div class="muscle-strip">
          <div><small>Principal</small><strong>${e.primary}</strong></div>
          <div><small>Secondaire</small><strong>${e.secondary||"—"}</strong></div>
        </div>
      </div>
      <section class="guide-section">
        <div class="guide-section-label">Technique</div>
        <h3>Bien faire le mouvement</h3>
        <ol class="guide-steps">${(Array.isArray(e.tips)?e.tips:[]).map((x,i)=>`<li><span>${i+1}</span><p>${x}</p></li>`).join("")}</ol>
      </section>
      <div class="guide-two">
        <section class="guide-section">
          <div class="guide-section-label">Respiration</div>
          <p>${e.breathing}</p>
        </section>
        <section class="guide-section danger">
          <div class="guide-section-label">À éviter</div>
          <ul>${(Array.isArray(e.mistakes)?e.mistakes:[]).map(x=>`<li>${x}</li>`).join("")}</ul>
        </section>
      </div>
      <section class="guide-section variants">
        <div class="guide-section-label">Progression</div>
        <div class="variant-grid">
          <div><small>Plus facile</small><strong>${e.easy}</strong></div>
          <div><small>Plus difficile</small><strong>${e.hard}</strong></div>
        </div>
      </section>`;
    openLayer("#modal");
  }

  on("#search","input",renderExercises);
  on("#closeModal","click",()=>closeLayer("#modal"));
  renderChips();renderExercises();

  return {renderExercises,closeGuide:()=>closeLayer("#modal")};
}
