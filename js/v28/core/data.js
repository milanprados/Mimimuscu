
const loadJson = async path => {
  const url = new URL(path, import.meta.url);
  const response=await fetch(url,{cache:"no-store"});
  if(!response.ok) throw new Error(`Impossible de charger ${path}`);
  return response.json();
};

export const EXERCISE_CATALOG=await loadJson("../../../data/exercises.json");
export const PROGRAM_CATALOG=await loadJson("../../../data/programs.json");
export const MILESTONE_CATALOG=await loadJson("../../../data/milestones.json");
export const BENCHMARK_CATALOG=await loadJson("../../../data/benchmarks.json");
export const FAMILY_CATALOG=await loadJson("../../../data/exercise_families.json");

const ROOT="https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const localAssetUrl = path => new URL(`../../../${path}`, import.meta.url).href;
const normalize=raw=>({
  name:raw.name,aliases:raw.aliases||[],cat:raw.category,category:raw.category,
  pattern:raw.movement_pattern,
  level:raw.difficulty==="beginner"?"Débutant":raw.difficulty==="intermediate"?"Intermédiaire":"Avancé",
  difficulty:raw.difficulty,mode:raw.mode,
  base:raw.prescription.base,min:raw.prescription.min,max:raw.prescription.max,step:raw.prescription.step,
  perSide:!!raw.prescription.per_side,
  quiet:!!raw.constraints.quiet,impact:raw.constraints.impact,equipment:raw.constraints.equipment,
  primary:raw.muscles.primary,secondary:raw.muscles.secondary,stabilizers:raw.muscles.stabilizers||"",
  familyId:raw.family_id,variantTier:raw.variant_tier,description:raw.description||"",guide:raw.guide||{},
  tips:raw.guide?.tips||raw.coaching.tips,mistakes:raw.guide?.errors||raw.coaching.mistakes,breathing:raw.guide?.breathing||raw.coaching.breathing,
  easy:raw.coaching.easier,hard:raw.coaching.harder,
  images:raw.visual?.provider==="local"
    ? [localAssetUrl(raw.visual.start),localAssetUrl(raw.visual.end)]
    : [`${ROOT}${raw.visual.asset_id}/0.jpg`,`${ROOT}${raw.visual.asset_id}/1.jpg`],
  thumb:raw.visual?.provider==="local" ? localAssetUrl(raw.visual.thumb) : null
});
export const EXERCISES=Object.fromEntries(EXERCISE_CATALOG.exercises.map(raw=>[raw.id,normalize(raw)]));
export const FAMILIES=FAMILY_CATALOG.families.map(f=>({
  ...f,
  base:EXERCISES[f.base_id],
  allIds:[...(f.variants.easier||[]),...(f.variants.standard||[]),...(f.variants.variations||[]),...(f.variants.harder||[])]
}));

export const PROGRAMS=PROGRAM_CATALOG.programs;
export const LEVEL_META=Object.fromEntries(Object.entries(PROGRAM_CATALOG.levels).map(([id,x])=>[
  id,{name:x.name,sessions:x.sessions_per_week}
]));
export const MILESTONES=MILESTONE_CATALOG.milestones.map(x=>({
  id:x.id,exerciseId:x.exercise_id,label:x.label,value:x.value,mode:x.mode
}));
export const TEST_SESSION={
  ...BENCHMARK_CATALOG.sessions[0],
  exercises:compileBlocksToSessionExercises(BENCHMARK_CATALOG.sessions[0].blocks)
};

export const MUSCLE_GROUPS=["Pecs","Épaules","Triceps","Dos","Jambes","Fessiers","Core"];
export const EXERCISE_LOAD={
 pushups:{Pecs:3,Épaules:1,Triceps:2,Core:1},close_pushups:{Pecs:1,Épaules:1,Triceps:3,Core:1},
 pike:{Pecs:1,Épaules:3,Triceps:2,Core:1},squat:{Jambes:3,Fessiers:2,Core:1},
 slow_squat:{Jambes:3,Fessiers:2,Core:1},reverse_lunge:{Jambes:3,Fessiers:2,Core:1},
 split_squat:{Jambes:3,Fessiers:2,Core:1},glute_bridge:{Jambes:1,Fessiers:3,Core:1},
 single_leg_glute_bridge:{Jambes:1,Fessiers:3,Core:1},plank:{Core:3,Épaules:1,Fessiers:1},
 hollow_hold:{Core:3},bear_hold:{Core:3,Épaules:1,Jambes:1},dead_bug:{Core:3},
 reverse_crunch:{Core:3},reverse_snow_angel:{Dos:3,Épaules:2},prone_ytw:{Dos:3,Épaules:2},
 superman_pull:{Dos:3,Épaules:1},side_plank_reach:{Core:3,Épaules:1}
};

export function workoutTemplate(program={}){
  const list=Array.isArray(PROGRAMS.adaptive)?PROGRAMS.adaptive:[];
  if(!list.length) throw new Error("Programme adaptatif introuvable.");
  const index=Math.abs(Number(program?.index)||0)%list.length;
  const template=list[index]||list[0];
  return {
    ...template,
    ids:compileBlocksToSessionExercises(template.blocks||[]).filter(x=>x.track!==false).map(x=>x.id)
  };
}

export function compileBlocksToSessionExercises(blocks=[]){
  const out=[];
  for(const block of (Array.isArray(blocks)?blocks:[])){
    const common={
      phase:block.phase||"Bloc principal",
      targetScale:Number(block.target_scale)||1,
      track:block.track!==false,
      adaptive:block.adaptive!==false,
      modeOverride:block.mode_override||null
    };
    if(block.type==="exercise"){
      const sets=Math.max(1,Number(block.sets)||1);
      for(let i=0;i<sets;i++) out.push({
        id:block.exercise_id,
        restAfter:Number(block.rest_after_sec)||0,
        targetOverride:block.target_override??null,
        tempo:block.tempo||null,note:block.note||"",
        test:!!block.test,
        ...common
      });
    } else if(block.type==="circuit" || block.type==="superset"){
      const rounds=Math.max(1,Number(block.rounds)||1);
      const items=Array.isArray(block.items)?block.items:[];
      for(let round=0;round<rounds;round++){
        items.forEach((entry,index)=>{
          const id=typeof entry==="string"?entry:entry.exercise_id;
          const itemScale=typeof entry==="object"&&entry.target_scale!=null?Number(entry.target_scale):common.targetScale;
          const isLast=index===items.length-1;
          out.push({
            id,
            restAfter:isLast
              ? (round<rounds-1 ? Number(block.rest_between_rounds_sec)||0 : 0)
              : Number(block.rest_between_exercises_sec)||0,
            note:block.note||"",
            round:round+1,
            targetScale:itemScale||1,
            phase:common.phase,
            track:common.track,
            adaptive:common.adaptive,
            modeOverride:common.modeOverride
          });
        });
      }
    } else {
      throw new Error(`Type de bloc inconnu: ${block.type}`);
    }
  }
  return out;
}

function interleave(items,meta){
  const plan=[];
  items.forEach((it,i)=>{
    plan.push(it);
    if(i<items.length-1){
      const rest=Number(it.restAfter);
      plan.push({kind:"rest",seconds:Number.isFinite(rest)?rest:25,phase:"Repos"});
    }
  });
  plan.meta=meta;return plan;
}

export function buildPlan(program){
  const tpl=workoutTemplate(program);
  const items=compileBlocksToSessionExercises(tpl.blocks||[]);
  return interleave(items,tpl);
}

export function programSession(program){
  const tpl=workoutTemplate(program);
  return {
    id:`program-${tpl.key}`,
    name:tpl.name,
    description:tpl.focus,
    level:"adaptive",
    week:tpl.week,
    day:tpl.day,
    intensity:tpl.intensity,
    durationTarget:20,
    exercises:compileBlocksToSessionExercises(tpl.blocks||[])
  };
}

export function buildPlanFromIds(ids,meta={key:"Custom",name:"Séance personnalisée",focus:"Personnalisée"}){
  const items=(Array.isArray(ids)?ids:[]).map((id,i)=>({id,phase:i<Math.ceil(ids.length/2)?"Bloc 1":"Bloc 2",restAfter:25}));
  return interleave(items,meta);
}

export function buildPlanFromSession(session){
  const items=(session.exercises||compileBlocksToSessionExercises(session.blocks||[])).map(item=>({
    ...item,phase:"Personnalisé"
  }));
  return interleave(items,{
    key:session.id==="benchmark"?"benchmark":"Custom",
    name:session.name||"Séance personnalisée",
    focus:session.description||"Personnalisée"
  });
}

export function compressSessionForDuration(session,minutes){
  const source=JSON.parse(JSON.stringify(session)),target=Number(minutes)||22;
  if(target>=28)return source;
  source.exercises=Array.isArray(source.exercises)?source.exercises:[];
  const minCount=target<=10?4:target<=15?5:target<=22?7:source.exercises.length;
  const priority=["pushups","pike","squat","reverse_lunge","reverse_snow_angel","superman_pull","plank"];
  const scored=source.exercises.map((item,index)=>({item,index,score:(priority.includes(item.id)?3:1)+(index<4?1:0)}));
  const keep=new Set(scored.sort((a,b)=>b.score-a.score||a.index-b.index)
    .slice(0,Math.min(minCount,source.exercises.length)).map(x=>x.index));
  source.exercises=source.exercises.filter((_,i)=>keep.has(i));
  source.description=`${source.description||""}${source.description?" • ":""}Version ${target} min`;
  return source;
}

export function richerSessionToFile(session){
  return {
    app:"mimi-muscu",type:"workout-session",version:3,
    name:session.name||"Séance personnalisée",
    description:session.description||"",
    level:session.level||"custom",
    blocks:(session.blocks||[
      {type:"circuit",rounds:1,rest_between_exercises_sec:25,rest_between_rounds_sec:45,
       items:(session.exercises||[]).map(x=>x.id)}
    ])
  };
}

export function validateRichImportedSession(raw){
  if(!raw||raw.app!=="mimi-muscu"||raw.type!=="workout-session")throw new Error("Format de séance invalide.");
  let blocks=raw.blocks;
  if(!blocks && Array.isArray(raw.exercises)){
    blocks=raw.exercises.map(item=>({
      type:"exercise",exercise_id:item.exercise_id,sets:item.sets||1,
      rest_after_sec:item.rest_after_sec||0,target_override:item.target_override??null,
      tempo:item.tempo||null,note:item.note||""
    }));
  }
  const exercises=compileBlocksToSessionExercises(blocks);
  for(const item of exercises) if(!EXERCISES[item.id]) throw new Error(`Exercice inconnu: ${item.id}`);
  return {
    id:crypto.randomUUID?crypto.randomUUID():`custom-${Date.now()}`,
    name:String(raw.name||"Séance importée").slice(0,80),
    description:String(raw.description||"").slice(0,240),
    level:["beginner","intermediate","advanced","custom"].includes(raw.level)?raw.level:"custom",
    blocks,exercises,
    createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  };
}
export const validateImportedSession=validateRichImportedSession;
export const sessionToFile=richerSessionToFile;
