
import {$,$$,wait,openLayer,closeLayer,formatDuration,on} from "../helpers.js";
import {preloadExercise} from "../utils/preload.js";

export function createWorkoutUI({state,EXERCISES,MUSCLE_GROUPS,EXERCISE_LOAD,save,kcal,level}) {
  let engine = null;
  let audioOn = true;
  let flipTimer = null;
  let reps = 0;
  let effort = "good";

  const setEngine = value => engine = value;

  function speak(text) {
    if (!audioOn || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1.04;
    speechSynthesis.speak(utterance);
  }

  function tone(freq=700) {
    if (!audioOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; gain.gain.value = .04;
      osc.start(); osc.stop(ctx.currentTime + .08);
    } catch (_) {}
  }

  function clearFlip() {
    if (flipTimer) clearInterval(flipTimer);
    flipTimer = null;
  }

  function openFocus() {
    openLayer("#focus");
  }

  function closeFocus() {
    engine?.stop();
    clearFlip();
    closeLayer("#focus");
  }

  function header(item) {
    $("#focusPhase").textContent=item?.phase||"";
    $("#focusStep").textContent=`${engine.i+1} / ${engine.plan.length}`;
    $("#focusXp").textContent=`LV ${level()} • ${state.xp} XP`;
    const bar=document.querySelector(".focus-progress span");
    if(bar)bar.style.width=`${Math.max(2,Math.min(100,((engine.i+1)/Math.max(1,engine.plan.length))*100))}%`;
  }

  function poses(ex) {
    return `<div class="pose-grid">
      <figure class="pose"><figcaption>Départ</figcaption><img src="${ex.images[0]}" alt=""></figure>
      <figure class="pose"><figcaption>Fin</figcaption><img src="${ex.images[1]}" alt=""></figure>
    </div>`;
  }

  function exerciseView({item,ex,target,next}) {
    if(next?.id)preloadExercise(EXERCISES[next.id]);
    clearFlip();header(item);reps=target;effort="good";
    $("#focusContent").innerHTML=`
      <div class="workout-screen">
        <div class="workout-title">
          <span>${item?.phase||"Exercice"}</span>
          <h2>${ex.name}</h2>
          <div class="target-pill"><strong>${target}</strong><small>${ex.perSide?" / côté":" reps"}</small></div>
        </div>
        ${poses(ex)}
        <div class="cue-card"><span>CONSIGNE</span><p>${ex.tips?.[0]||"Mouvement propre et contrôlé."}</p></div>
        <div class="workout-controls">
          <div class="rep-row">
            <button id="minus" aria-label="Retirer une répétition">−</button>
            <div><strong id="repVal">${target}</strong><small>réalisées</small></div>
            <button id="plus" aria-label="Ajouter une répétition">+</button>
          </div>
          <div class="effort-label">Comment c’était ?</div>
          <div class="effort">
            <button data-e="easy">Facile</button>
            <button data-e="good" class="sel">Propre</button>
            <button data-e="hard">Dur</button>
          </div>
          <button class="primary-btn workout-done" id="done">Terminé</button>
          <div class="workout-secondary">
            <button id="skip">Passer</button>
            <span>${next?`Après : ${EXERCISES[next.id]?.name||"exercice suivant"}`:"Dernier exercice"}</span>
          </div>
        </div>
      </div>`;

    on("#minus","click",()=>{$("#repVal").textContent=reps=Math.max(0,reps-1)});
    on("#plus","click",()=>{$("#repVal").textContent=++reps});
    $$("[data-e]").forEach(button=>button.addEventListener("click",()=>{
      effort=button.dataset.e;
      $$("[data-e]").forEach(x=>x.classList.toggle("sel",x===button));
    }));
    on("#done","click",()=>engine.completeReps(reps,effort));
    on("#skip","click",()=>engine.skip());
  }

  function timerView({item,ex,target}) {
    clearFlip();header(item);
    $("#focusContent").innerHTML=`
      <div class="workout-screen timed">
        <div class="workout-title">
          <span>${item?.phase||"Exercice"}</span>
          <h2>${ex.name}</h2>
        </div>
        <div class="timer-visual" id="tv">
          <img class="start" src="${ex.images[0]}" alt="">
          <img class="end" src="${ex.images[1]}" alt="">
          <span class="timer-tag" id="tt">Départ</span>
          <div class="timer-overlay"><strong id="time">${target}</strong><small>sec</small></div>
        </div>
        <div class="cue-card"><span>CONSIGNE</span><p>${ex.tips?.[0]||"Mouvement contrôlé."}</p></div>
        <div class="timer-actions">
          <button class="primary-btn" id="pause">Pause</button>
          <button class="soft-btn" id="early">Terminer maintenant</button>
          <button class="text-danger" id="skipT">Passer l’exercice</button>
        </div>
      </div>`;

    let swapped=false;
    flipTimer=setInterval(()=>{
      swapped=!swapped;
      $("#tv")?.classList.toggle("swap",swapped);
      if($("#tt"))$("#tt").textContent=swapped?"Fin":"Départ";
    },1400);

    on("#pause","click",()=>engine.pause());
    on("#early","click",()=>engine.complete(true));
    on("#skipT","click",()=>engine.skip());
  }

  function restView({seconds,next,nextEx}) {
    preloadExercise(nextEx);clearFlip();header(engine.plan[engine.i]);
    $("#focusContent").innerHTML=`
      <div class="recovery-screen">
        <div class="recovery-orbit"><strong id="rest">${seconds}</strong><small>sec</small></div>
        <div class="recovery-label">RÉCUPÈRE</div>
        ${nextEx?`<div class="next-card">
          <div class="next-copy"><small>Ensuite</small><h3>${nextEx.name}</h3>
          <strong>${engine.target(next.id,next)}${nextEx.mode==="time"?" sec":nextEx.perSide?" / côté":" reps"}</strong></div>
          <div class="next-visual"><img src="${nextEx.thumb||nextEx.images[0]}" alt=""></div>
        </div>
        <div class="recovery-tip">${nextEx.tips?.[0]||""}</div>`:""}
        <button class="soft-btn" id="skipRest">Passer le repos</button>
      </div>`;
    speak(`Récupération. Prochain exercice ${nextEx?.name||"fin"}`);
    on("#skipRest","click",()=>engine.skipRest());
  }

  async function countdown({item,ex,done}) {
    clearFlip();header(item);
    $("#focusContent").innerHTML=`
      <div class="count-screen">
        <span class="count-kicker">PRÊT POUR</span>
        <h2>${ex.name}</h2>
        <img class="count-image" src="${ex.thumb||ex.images[0]}" alt="">
        <div class="count-num" id="count">3</div>
      </div>`;
    speak(`Prochain exercice ${ex.name}`);
    for(const n of [3,2,1]){
      if(!$("#count"))return;
      $("#count").textContent=n;tone(n===1?920:680);await wait(850);
    }
    done();
  }

  function muscleLoadForRecord(record) {
    const totals=Object.fromEntries((Array.isArray(MUSCLE_GROUPS)?MUSCLE_GROUPS:[]).map(m=>[m,0]));
    for (const set of record?.sets || []) {
      if (set.skipped) continue;
      const load=EXERCISE_LOAD[set.id] || {};
      for (const [muscle,value] of Object.entries(load)) totals[muscle]+=value;
    }
    return totals;
  }

  function finished({xp,score,records,duration,record}) {
    clearFlip();
    const cal=kcal(duration);
    const loads=muscleLoadForRecord(record);
    const sorted=Object.entries(loads).sort((a,b)=>b[1]-a[1]).filter(([,v])=>v>0).slice(0,4);
    const max=Math.max(1,...sorted.map(([,v])=>v));
    const topMuscles=sorted.map(([m,v])=>`${m} ${"█".repeat(Math.max(1,Math.round(v/max*8)))}${"░".repeat(Math.max(0,8-Math.round(v/max*8)))}`).join("<br>");

    const changes=[];
    for (const set of record.sets || []) {
      if (set.skipped) continue;
      const next=state.targets[set.id];
      if (next && next!==set.target) changes.push(`${EXERCISES[set.id].name}: ${set.target} → ${next}`);
    }

    if (record.sessionKey==="benchmark" || record.sessionName==="Test de progression") {
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
          <div><strong>${formatDuration(duration)}</strong><span>durée</span></div>
          <div><strong>${cal?`~${cal}`:"—"}</strong><span>kcal</span></div>
        </div>
        <div class="analysis-card"><h3>Charge musculaire</h3><p>${topMuscles||"Séance légère"}</p></div>
        <div class="analysis-card"><h3>Coach</h3>
          <p>${changes.length?`Progression appliquée : ${changes.slice(0,3).join(" • ")}.`:"Objectifs maintenus : continue à privilégier la technique."}</p>
          <p>${records.length?`🏆 ${records.length} nouveau${records.length>1?"x":""} record${records.length>1?"s":""}.`:""}</p>
        </div>
        <button class="primary-btn yellow-bg" id="finish">Terminer</button>
        <button class="ghost" id="askCoachAfter" style="margin-top:8px;width:100%">Demander au coach</button>
      </div>`;

    on("#finish","click",()=>{
      closeFocus();
      window.dispatchEvent(new CustomEvent("mimi:refresh",{detail:{tab:"progress"}}));
    });
    on("#askCoachAfter","click",async()=>{
      closeFocus();
      window.dispatchEvent(new CustomEvent("mimi:refresh",{detail:{tab:"profile"}}));
      try { await navigator.clipboard.writeText($("#coachPrompt")?.value || ""); } catch (_) {}
      window.open("https://chatgpt.com/","_blank");
    });
  }

  function bindStaticControls() {
    on("#exitFocus","click",()=>{
      if (confirm("Quitter la séance ?")) closeFocus();
    });
    on("#audio","click",()=>{
      audioOn=!audioOn;
      $("#audio").textContent=audioOn?"🔊":"🔇";
    });
  }

  return {
    setEngine, openFocus, closeFocus, bindStaticControls,
    hooks:{
      exercise:exerciseView,
      timer:timerView,
      rest:restView,
      countdown,
      finished,
      tick:value=>{
        if ($("#time")) $("#time").textContent=value;
        if ($("#rest")) $("#rest").textContent=value;
      },
      paused:paused=>{if ($("#pause")) $("#pause").textContent=paused?"Reprendre":"Pause"}
    }
  };
}
