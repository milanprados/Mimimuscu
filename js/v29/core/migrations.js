
export const CURRENT_STATE_VERSION = 29;

function ensure(state,key,valueFactory){
  if(state[key] == null) state[key] = valueFactory();
}

const migrations = {
  20(state){
    ensure(state,"preferences",()=>({defaultDuration:22,autoSuggest:true}));
    ensure(state,"measurements",()=>[]);
    ensure(state,"benchmark",()=>({lastDate:"",dueEveryDays:28}));
    ensure(state,"achievements",()=>({}));
    return state;
  },
  21(state){
    ensure(state,"customSessions",()=>[]);
    ensure(state,"sessionDraft",()=>null);
    return state;
  },
  22(state){
    ensure(state,"backupMeta",()=>({lastExportAt:""}));
    if(!state.program) state.program={level:"beginner",index:0};
    return state;
  },
  23(state){ return state; },
  24(state){ return state; },
  25(state){ return state; },
  26(state){
    state.program={level:"adaptive",index:0};
    state.sessionDraft=null;
    if(!state.preferences)state.preferences={};
    state.preferences.autoSuggest=true;
    return state;
  },
  27(state){ return state; },
  28(state){ return state; },
  29(state){
    ensure(state,"profileMeta",()=>({nickname:"",startedAt:""}));
    ensure(state,"progressBaseline",()=>({createdAt:"",values:{}}));
    ensure(state,"goals",()=>[]);
    return state;
  }
};

export function migrateState(input){
  const state = structuredClone(input || {});
  let version = Number(state.version || 19);
  while(version < CURRENT_STATE_VERSION){
    const next = version + 1;
    if(migrations[next]) migrations[next](state);
    version = next;
    state.version = version;
  }
  state.version = CURRENT_STATE_VERSION;
  return state;
}
