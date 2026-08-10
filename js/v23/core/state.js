
import {migrateState,CURRENT_STATE_VERSION} from "./migrations.js";

const KEY="mimiMuscuV22";
const OLD_KEYS=["mimiMuscuV20","coachV20","coachV19","coachV18"];

const DEFAULT={
  version:CURRENT_STATE_VERSION,
  program:{level:"beginner",index:0},
  profile:{age:"",heightCm:"",weightKg:""},
  targets:{},
  bests:{},
  sessions:0,attempts:0,xp:0,streak:0,lastDay:"",
  history:[],chatUrl:"",
  sessionDraft:null,
  customSessions:[],
  preferences:{defaultDuration:22,autoSuggest:true},
  measurements:[],
  benchmark:{lastDate:"",dueEveryDays:28},
  achievements:{},
  backupMeta:{lastExportAt:""}
};

function readAny(){
  for(const key of [KEY,...OLD_KEYS]){
    try{
      const raw=localStorage.getItem(key);
      if(raw) return JSON.parse(raw);
    }catch(_){}
  }
  return null;
}


function normalizeCustomSessions(sessions){
  return (Array.isArray(sessions)?sessions:[]).map((session,index)=>{
    const safe={...session};
    safe.id=safe.id||`legacy-${index}-${Date.now()}`;
    safe.name=safe.name||"Séance personnalisée";
    safe.description=safe.description||"";
    if(!Array.isArray(safe.exercises)){
      safe.exercises=[];
      if(Array.isArray(safe.blocks)){
        for(const block of safe.blocks){
          if(block?.type==="exercise" && block.exercise_id){
            const sets=Math.max(1,Number(block.sets)||1);
            for(let i=0;i<sets;i++)safe.exercises.push({
              id:block.exercise_id,restAfter:Number(block.rest_after_sec)||0,
              targetOverride:block.target_override??null,tempo:block.tempo||null,note:block.note||""
            });
          }else if((block?.type==="circuit"||block?.type==="superset") && Array.isArray(block.items)){
            const rounds=Math.max(1,Number(block.rounds)||1);
            for(let r=0;r<rounds;r++)block.items.forEach((id,i)=>safe.exercises.push({
              id,
              restAfter:i===block.items.length-1
                ? (r<rounds-1?(Number(block.rest_between_rounds_sec)||0):0)
                : (Number(block.rest_between_exercises_sec)||0)
            }));
          }
        }
      }
    }
    safe.exercises=safe.exercises.filter(x=>x&&x.id);
    return safe;
  });
}

export function load(exercises){
  let state=migrateState({...DEFAULT,...(readAny()||{})});
  state.program={...DEFAULT.program,...(state.program||{})};
  state.profile={...DEFAULT.profile,...(state.profile||{})};
  state.preferences={...DEFAULT.preferences,...(state.preferences||{})};
  state.benchmark={...DEFAULT.benchmark,...(state.benchmark||{})};
  state.customSessions=normalizeCustomSessions(state.customSessions);
  state.measurements=Array.isArray(state.measurements)?state.measurements:[];
  state.history=Array.isArray(state.history)?state.history:[];
  state.targets=state.targets||{};
  state.bests=state.bests||{};
  state.achievements=state.achievements||{};
  state.backupMeta={...DEFAULT.backupMeta,...(state.backupMeta||{})};

  for(const [id,ex] of Object.entries(exercises)){
    if(state.targets[id]==null) state.targets[id]=state.targets[ex.name]??ex.base;
  }
  save(state);
  return state;
}

export const save=state=>localStorage.setItem(KEY,JSON.stringify(state));
export const replaceState=state=>localStorage.setItem(KEY,JSON.stringify(migrateState(state)));
export const dayKey=()=>new Date().toISOString().slice(0,10);
export const storageKey=KEY;
