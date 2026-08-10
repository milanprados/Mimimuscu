
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

export function load(exercises){
  let state=migrateState({...DEFAULT,...(readAny()||{})});
  state.program={...DEFAULT.program,...(state.program||{})};
  state.profile={...DEFAULT.profile,...(state.profile||{})};
  state.preferences={...DEFAULT.preferences,...(state.preferences||{})};
  state.benchmark={...DEFAULT.benchmark,...(state.benchmark||{})};
  state.customSessions=Array.isArray(state.customSessions)?state.customSessions:[];
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
