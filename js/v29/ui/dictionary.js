
import {$,$$,on,openLayer,closeLayer} from "../helpers.js";

export function initDictionary({EXERCISES,FAMILIES}) {
  const cats=["Tous","Haut du corps","Jambes","Fessiers","Dos","Core","Cardio","Full body","Mobilité"];
  let cat="Tous",quietOnly=true,noEquipmentOnly=true,currentFamily=null,currentExercise=null;

  const familyById=id=>FAMILIES.find(f=>f.id===id);
  const tierNames={easier:"Plus facile",standard:"Référence",variations:"Variantes",harder:"Plus difficile"};

  function visibleVariants(f){
    return (f.allIds||[]).map(id=>EXERCISES[id]).filter(Boolean)
      .filter(e=>(!quietOnly||e.quiet)&&(!noEquipmentOnly||e.equipment==="none"));
  }
  function matches(f,q){
    const vars=visibleVariants(f);
    if(!vars.length)return false;
    if(cat!=="Tous"&&f.category!==cat)return false;
    if(!q)return true;
    const hay=[f.name,f.category,f.description,...(f.search_terms||[]),...vars.flatMap(e=>[e.name,e.primary,e.secondary,e.description])].join(" ").toLowerCase();
    return hay.includes(q);
  }

  function renderChips(){
    $("#chips").innerHTML=
      `<button class="filter-chip utility ${quietOnly?"active":""}" id="quietFilter">Silencieux</button>
       <button class="filter-chip utility ${noEquipmentOnly?"active":""}" id="equipmentFilter">Sans matériel</button>`+
      cats.map(c=>`<button class="filter-chip ${c===cat?"active":""}" data-c="${c}">${c}</button>`).join("");
    on("#quietFilter","click",()=>{quietOnly=!quietOnly;renderChips();renderFamilies()});
    on("#equipmentFilter","click",()=>{noEquipmentOnly=!noEquipmentOnly;renderChips();renderFamilies()});
    $$("[data-c]").forEach(b=>b.addEventListener("click",()=>{cat=b.dataset.c;renderChips();renderFamilies()}));
  }

  function renderFamilies(){
    const q=($("#search")?.value||"").trim().toLowerCase();
    const list=FAMILIES.filter(f=>matches(f,q)).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
    $("#exerciseCount").textContent=`${list.length} familles · ${Object.keys(EXERCISES).length} mouvements`;
    $("#exerciseList").innerHTML=list.map(f=>{
      const base=EXERCISES[f.base_id],count=visibleVariants(f).length;
      return `<button class="exercise-card family-card" data-family="${f.id}">
        <div class="exercise-thumb"><img src="${base.thumb||base.images[0]}" alt="" loading="lazy" decoding="async"></div>
        <div class="exercise-copy">
          <div class="exercise-card-top"><strong>${f.name}</strong><span class="exercise-arrow">→</span></div>
          <small>${f.description}</small>
          <div class="exercise-meta"><span>${f.category}</span><span>${count} mouvement${count>1?"s":""}</span></div>
        </div>
      </button>`;
    }).join("");
    $$("[data-family]").forEach(b=>b.addEventListener("click",()=>openFamily(b.dataset.family)));
  }

  function variantCard(id){
    const e=EXERCISES[id];if(!e)return"";
    if((quietOnly&&!e.quiet)||(noEquipmentOnly&&e.equipment!=="none"))return"";
    return `<button class="variant-card" data-exercise="${id}">
      <div class="variant-thumb"><img src="${e.thumb||e.images[0]}" alt=""></div>
      <div><strong>${e.name}</strong><small>${e.primary}</small></div><span>→</span>
    </button>`;
  }

  function openFamily(id){
    const f=familyById(id);if(!f)return;
    currentFamily=id;currentExercise=null;
    const base=EXERCISES[f.base_id];
    $("#modalTitle").textContent=f.name;
    $("#modalBody").innerHTML=`
      <div class="family-hero">
        <div class="family-visual"><img src="${base.thumb||base.images[0]}" alt=""></div>
        <div><span class="guide-kicker">${f.category}</span><p>${f.description}</p></div>
      </div>
      <div class="family-base">
        <span class="eyebrow">MOUVEMENT DE RÉFÉRENCE</span>
        <button class="base-exercise-card" data-exercise="${f.base_id}">
          <div><strong>${base.name}</strong><small>${base.primary} · ${base.secondary}</small></div><span>Guide →</span>
        </button>
      </div>
      <div class="variant-groups">
        ${["easier","standard","variations","harder"].map(t=>{
          const cards=(f.variants[t]||[]).filter(id=>id!==f.base_id).map(variantCard).filter(Boolean).join("");
          return cards?`<section class="variant-section tier-${t}">
            <div class="variant-heading"><span>${tierNames[t]}</span></div>${cards}
          </section>`:"";
        }).join("")}
      </div>`;
    openLayer("#modal");
    $$("[data-exercise]").forEach(b=>b.addEventListener("click",()=>openExercise(b.dataset.exercise)));
  }

  function relations(ids=[]){
    return ids.map(id=>{
      const e=EXERCISES[id];if(!e)return"";
      return `<button data-related="${id}"><strong>${e.name}</strong><span>→</span></button>`;
    }).join("");
  }

  function openExercise(id){
    const e=EXERCISES[id];if(!e)return;
    currentExercise=id;$("#modalTitle").textContent=e.name;
    const g=e.guide||{};
    $("#modalBody").innerHTML=`
      <div class="guide-hero">
        <div class="guide-kicker">${e.cat} · ${e.mode==="time"?"Temps":"Répétitions"}</div>
        <p class="exercise-description">${e.description}</p>
        <div class="guide-images">
          <figure><span>Départ</span><img src="${e.images[0]}" alt=""></figure>
          <figure><span>Fin</span><img src="${e.images[1]}" alt=""></figure>
        </div>
        <div class="muscle-grid">
          <div><small>Principaux</small><strong>${e.primary}</strong></div>
          <div><small>Secondaires</small><strong>${e.secondary||"—"}</strong></div>
          <div class="wide"><small>Stabilisateurs</small><strong>${e.stabilizers||"—"}</strong></div>
        </div>
      </div>
      ${g.specific_note?`<div class="specific-note"><span>À retenir</span><p>${g.specific_note}</p></div>`:""}
      <section class="guide-section">
        <div class="guide-section-label">Installation</div><h3>Avant de commencer</h3>
        <ol class="guide-steps">${(g.setup||[]).map((x,i)=>`<li><span>${i+1}</span><p>${x}</p></li>`).join("")}</ol>
      </section>
      <section class="guide-section">
        <div class="guide-section-label">Exécution</div><h3>Étape par étape</h3>
        <ol class="guide-steps">${(g.execution||[]).map((x,i)=>`<li><span>${i+1}</span><p>${x}</p></li>`).join("")}</ol>
      </section>
      <div class="guide-two">
        <section class="guide-section tips-section"><div class="guide-section-label">Tips</div><ul>${(g.tips||[]).map(x=>`<li>${x}</li>`).join("")}</ul></section>
        <section class="guide-section danger"><div class="guide-section-label">Erreurs à éviter</div><ul>${(g.errors||[]).map(x=>`<li>${x}</li>`).join("")}</ul></section>
      </div>
      <section class="guide-section breathing-card"><div class="guide-section-label">Respiration</div><p>${g.breathing||e.breathing}</p></section>
      ${((g.easier_ids||[]).length||(g.harder_ids||[]).length)?`
        <section class="guide-section progression-links">
          <div class="guide-section-label">Changer de niveau</div>
          ${(g.easier_ids||[]).length?`<div class="relation-block"><small>Plus simple</small>${relations(g.easier_ids)}</div>`:""}
          ${(g.harder_ids||[]).length?`<div class="relation-block"><small>Plus difficile</small>${relations(g.harder_ids)}</div>`:""}
        </section>`:""}`;
    $$("[data-related]").forEach(b=>b.addEventListener("click",()=>openExercise(b.dataset.related)));
  }

  function back(){
    if(currentExercise&&currentFamily){currentExercise=null;openFamily(currentFamily)}
    else{currentExercise=null;currentFamily=null;closeLayer("#modal")}
  }
  on("#search","input",renderFamilies);
  on("#closeModal","click",back);
  renderChips();renderFamilies();
  return {renderExercises:renderFamilies,closeGuide:()=>{currentExercise=null;currentFamily=null;closeLayer("#modal")}};
}
