const CATALOG_URL = "./exercises.json";
const response = await fetch(CATALOG_URL, {cache:"no-store"});
if(!response.ok) throw new Error(`Impossible de charger ${CATALOG_URL}`);
export const EXERCISE_CATALOG = await response.json();

const ROOT="https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";
const normalize = raw => ({
  name:raw.name,
  aliases:raw.aliases||[],
  cat:raw.category,
  category:raw.category,
  pattern:raw.movement_pattern,
  level:raw.difficulty==="beginner"?"Débutant":raw.difficulty==="intermediate"?"Intermédiaire":"Avancé",
  difficulty:raw.difficulty,
  mode:raw.mode,
  base:raw.prescription.base,
  min:raw.prescription.min,
  max:raw.prescription.max,
  step:raw.prescription.step,
  perSide:!!raw.prescription.per_side,
  quiet:!!raw.constraints.quiet,
  impact:raw.constraints.impact,
  equipment:raw.constraints.equipment,
  primary:raw.muscles.primary,
  secondary:raw.muscles.secondary,
  tips:raw.coaching.tips,
  mistakes:raw.coaching.mistakes,
  breathing:raw.coaching.breathing,
  easy:raw.coaching.easier,
  hard:raw.coaching.harder,
  images:[
    `${ROOT}${raw.visual.asset_id}/0.jpg`,
    `${ROOT}${raw.visual.asset_id}/1.jpg`
  ]
});
export const EXERCISES=Object.fromEntries(EXERCISE_CATALOG.exercises.map(raw=>[raw.id,normalize(raw)]));

export const PROGRAMS={
  beginner:[
    {key:"A",name:"Push + jambes",focus:"Pecs • épaules • jambes",ids:["pushups","squat","glute_bridge","plank","pushups","reverse_lunge","reverse_snow_angel","dead_bug"]},
    {key:"B",name:"Dos + posture + core",focus:"Dos • épaules • abdos",ids:["pike","reverse_snow_angel","reverse_lunge","dead_bug","knee_pushups","superman_pull","glute_bridge","side_plank_left"]},
    {key:"C",name:"Full body",focus:"Corps entier",ids:["pushups","reverse_lunge","reverse_snow_angel","plank","pike","slow_squat","reverse_crunch","glute_bridge"]}
  ],
  intermediate:[
    {key:"A",name:"Pecs + épaules",focus:"Pecs • épaules • triceps",ids:["tempo_pushups","pike","split_squat","dead_bug","wide_pushups","close_pushups","wall_sit","plank"]},
    {key:"B",name:"Jambes + dos",focus:"Jambes • dos • posture",ids:["split_squat","single_leg_glute_bridge","reverse_snow_angel","hollow_hold","reverse_lunge","single_leg_calf_raise","superman_pull","side_plank_reach"]},
    {key:"C",name:"Push + core",focus:"Pecs • épaules • abdos",ids:["pushups","pike","bear_hold","reverse_crunch","tempo_pushups","prone_ytw","dead_bug","side_plank_left"]},
    {key:"D",name:"Full body dense",focus:"Corps entier • densité",ids:["close_pushups","slow_squat","superman_pull","plank","wide_pushups","reverse_lunge","single_leg_glute_bridge","hollow_hold"]}
  ],
  advanced:[
    {key:"A",name:"Push hypertrophie",focus:"Pecs • épaules • triceps",ids:["tempo_pushups","pike","close_pushups","split_squat","wide_pushups","tempo_pushups","bear_hold","hollow_hold"]},
    {key:"B",name:"Jambes + chaîne postérieure",focus:"Jambes • fessiers • dos",ids:["split_squat","single_leg_glute_bridge","wall_sit","reverse_snow_angel","reverse_lunge","single_leg_calf_raise","superman_pull","side_plank_reach"]},
    {key:"C",name:"Épaules + core",focus:"Épaules • abdos • posture",ids:["pike","tempo_pushups","prone_ytw","hollow_hold","close_pushups","bear_hold","reverse_crunch","side_plank_reach"]},
    {key:"D",name:"Full body intensif",focus:"Corps entier",ids:["tempo_pushups","split_squat","superman_pull","plank","pike","single_leg_glute_bridge","wide_pushups","hollow_hold"]}
  ]
};
export const LEVEL_META={beginner:{name:"Débutant",sessions:3},intermediate:{name:"Intermédiaire",sessions:4},advanced:{name:"Avancé",sessions:4}};

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

export const MILESTONES=[
 {id:"pushups_20",exerciseId:"pushups",label:"20 pompes propres",value:20,mode:"reps"},
 {id:"plank_60",exerciseId:"plank",label:"60 s de planche",value:60,mode:"time"},
 {id:"pike_12",exerciseId:"pike",label:"12 pike push-ups",value:12,mode:"reps"},
 {id:"lunge_15",exerciseId:"reverse_lunge",label:"15 fentes / côté",value:15,mode:"reps"},
 {id:"deadbug_16",exerciseId:"dead_bug",label:"16 dead bugs / côté",value:16,mode:"reps"}
];
export const TEST_SESSION={id:"benchmark",name:"Test de progression",description:"Recalibrage périodique",level:"custom",exercises:[
 {id:"pushups",restAfter:60,test:true},{id:"plank",restAfter:60,test:true},{id:"pike",restAfter:60,test:true},
 {id:"reverse_lunge",restAfter:45,test:true},{id:"dead_bug",restAfter:0,test:true}
]};

export function workoutTemplate(program){const list=PROGRAMS[program.level]||PROGRAMS.beginner;return list[(program.index||0)%list.length]}
export function buildPlan(program){
 const tpl=workoutTemplate(program);const items=[
  {kind:"exercise",id:"squat",phase:"Échauffement",warm:true,durationOverride:30},
  {kind:"exercise",id:"reverse_lunge",phase:"Échauffement",warm:true,repsOverride:6},
  ...tpl.ids.map((id,i)=>({kind:"exercise",id,phase:i<4?"Bloc 1":"Bloc 2"}))
 ];return interleave(items,tpl)
}
function interleave(items,meta){
 const plan=[];items.forEach((it,i)=>{plan.push(it);if(i<items.length-1){const next=items[i+1];const block=it.phase.startsWith("Bloc")&&next.phase.startsWith("Bloc")&&it.phase!==next.phase;plan.push({kind:"rest",seconds:block?45:25,phase:block?"Repos long":"Repos"})}});plan.meta=meta;return plan
}
export function buildPlanFromIds(ids,meta={key:"Custom",name:"Séance personnalisée",focus:"Personnalisée"}){
 const items=[{kind:"exercise",id:"squat",phase:"Échauffement",warm:true,durationOverride:30},{kind:"exercise",id:"reverse_lunge",phase:"Échauffement",warm:true,repsOverride:6},...ids.map((id,i)=>({kind:"exercise",id,phase:i<Math.ceil(ids.length/2)?"Bloc 1":"Bloc 2"}))];return interleave(items,meta)
}
export function buildPlanFromSession(session){
 const plan=[];(session.exercises||[]).forEach((item,index)=>{plan.push({kind:"exercise",id:item.id,phase:"Personnalisé",targetOverride:item.targetOverride,tempo:item.tempo,note:item.note});if(index<session.exercises.length-1)plan.push({kind:"rest",seconds:Number.isFinite(item.restAfter)?item.restAfter:25,phase:"Repos"})});plan.meta={key:session.id==="benchmark"?"benchmark":"Custom",name:session.name||"Séance personnalisée",focus:session.description||"Personnalisée"};return plan
}
export function compressSessionForDuration(session,minutes){
 const source=JSON.parse(JSON.stringify(session)),target=Number(minutes)||22;if(target>=28)return source;
 const minCount=target<=10?4:target<=15?5:target<=22?7:source.exercises.length;
 const priority=["pushups","pike","squat","reverse_lunge","reverse_snow_angel","superman_pull","plank"];
 const scored=source.exercises.map((item,index)=>({item,index,score:(priority.includes(item.id)?3:1)+(index<4?1:0)}));
 const keep=new Set(scored.sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,Math.min(minCount,source.exercises.length)).map(x=>x.index));
 source.exercises=source.exercises.filter((_,i)=>keep.has(i));source.description=`${source.description||""}${source.description?" • ":""}Version ${target} min`;return source
}
export function sessionToFile(session){return richerSessionToFile(session)}
export function richerSessionToFile(session){return {app:"mimi-muscu",type:"workout-session",version:2,name:session.name||"Séance personnalisée",description:session.description||"",level:session.level||"custom",duration_target_min:session.durationTarget||null,exercises:(session.exercises||[]).map(item=>({exercise_id:item.id,rest_after_sec:Number.isFinite(item.restAfter)?item.restAfter:25,sets:item.sets||1,target_override:item.targetOverride??null,tempo:item.tempo||null,note:item.note||""}))}}
function parseImported(raw){
 if(!raw||typeof raw!=="object"||raw.app!=="mimi-muscu"||raw.type!=="workout-session"||!Array.isArray(raw.exercises)||!raw.exercises.length)throw new Error("Format de séance invalide.");
 const exercises=[];raw.exercises.forEach((item,index)=>{if(!EXERCISES[item.exercise_id])throw new Error(`Exercice inconnu ligne ${index+1}: ${item.exercise_id}`);const sets=Math.max(1,Math.min(6,Number(item.sets)||1));for(let n=0;n<sets;n++)exercises.push({id:item.exercise_id,restAfter:Math.max(0,Math.min(180,Number(item.rest_after_sec)||0)),targetOverride:item.target_override==null?null:Number(item.target_override),tempo:item.tempo?String(item.tempo).slice(0,20):null,note:item.note?String(item.note).slice(0,180):""})});
 return {id:crypto.randomUUID?crypto.randomUUID():`custom-${Date.now()}`,name:String(raw.name||"Séance importée").slice(0,80),description:String(raw.description||"").slice(0,240),level:["beginner","intermediate","advanced","custom"].includes(raw.level)?raw.level:"custom",durationTarget:Number(raw.duration_target_min)||null,exercises,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}
}
export const validateImportedSession=parseImported;
export const validateRichImportedSession=parseImported;
