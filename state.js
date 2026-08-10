
const KEY="mimiMuscuV20";
const DEFAULT={
  version:16,
  program:{level:"beginner",index:0},
  profile:{age:"",heightCm:"",weightKg:""},
  targets:{},
  bests:{},
  sessions:0,attempts:0,xp:0,streak:0,lastDay:"",
  history:[],chatUrl:"",
  sessionDraft:null,
  customSessions:[],
  preferences:{
    defaultDuration:22,
    autoSuggest:true
  },
  measurements:[],
  benchmark:{
    lastDate:"",
    dueEveryDays:28
  },
  achievements:{}
};
export function load(exercises){
  let state=null;
  for(const key of [KEY,"coachV19","coachV18","coachV17","coachV16","coachV15","coachV14","coachV13","coachV12"]){
    try{const raw=localStorage.getItem(key);if(raw){state={...DEFAULT,...JSON.parse(raw)};break}}catch(_){}
  }
  state ||= structuredClone(DEFAULT);
  state.program={...DEFAULT.program,...(state.program||{})};
  state.customSessions = Array.isArray(state.customSessions) ? state.customSessions : [];
  state.preferences={defaultDuration:22,autoSuggest:true,...(state.preferences||{})};
  state.measurements=Array.isArray(state.measurements)?state.measurements:[];
  state.benchmark={lastDate:"",dueEveryDays:28,...(state.benchmark||{})};
  state.achievements=state.achievements||{};
  state.profile={...DEFAULT.profile,...(state.profile||{})};
  for(const [id,ex] of Object.entries(exercises)){
    if(state.targets[id]==null) state.targets[id]=state.targets[ex.name]??ex.base;
  }
  return state;
}
export const save=state=>localStorage.setItem(KEY,JSON.stringify(state));
export const dayKey=()=>new Date().toISOString().slice(0,10);
