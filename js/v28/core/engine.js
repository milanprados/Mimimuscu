
import {EXERCISES,buildPlan,buildPlanFromIds,buildPlanFromSession,workoutTemplate} from "./data.js";
import {save,dayKey} from "./state.js";

export class Engine{
  constructor(state,hooks){this.state=state;this.hooks=hooks;this.resetRuntime()}
  resetRuntime(){this.plan=[];this.i=-1;this.timer=null;this.remaining=0;this.running=false;this.log=[];this.startedAt=null;this.phaseAt=null;this.reps=0;this.effort="good";this.redo=false;this.advancesProgram=true}
  ex(){const x=this.plan[this.i];return x?.kind==="exercise"?EXERCISES[x.id]:null}
  target(id,item=this.plan[this.i]){
    const ex=EXERCISES[id];
    const explicit=item?.targetOverride ?? item?.repsOverride ?? item?.durationOverride;
    if(explicit!=null) return Math.max(1,Math.round(explicit));
    const base=this.state.targets[id] ?? ex.base;
    const scale=Number(item?.targetScale)||1;
    if(scale===1) return base;
    const scaled=Math.round(base*scale);
    return Math.max(ex.mode==="time"?10:Math.min(ex.min||1,base),scaled);
  }
  start(redo=false, customSession=null){
    this.stop();this.resetRuntime();this.redo=redo;
    if(customSession){
      this.plan=buildPlanFromSession(customSession);
      this.advancesProgram=String(customSession.id||"").startsWith("program-");
    } else {
      this.advancesProgram=true;
      const template=workoutTemplate(this.state.program);
      const draft=this.state.sessionDraft;
      const draftMatches=draft && draft.templateKey===template.key && draft.level===this.state.program.level;
      this.plan=draftMatches
        ? buildPlanFromIds(draft.ids,{key:template.key,name:template.name,focus:template.focus})
        : buildPlan(this.state.program);
    }
    this.i=0;this.startedAt=Date.now();this.countdown()
  }
  stop(){if(this.timer)clearInterval(this.timer);this.timer=null;this.running=false}
  nextExercise(from=this.i+1){for(let j=from;j<this.plan.length;j++)if(this.plan[j].kind==="exercise")return this.plan[j];return null}
  async countdown(){const item=this.plan[this.i];if(!item)return this.finish();this.hooks.countdown?.({item,ex:EXERCISES[item.id],done:()=>this.enter()})}
  enter(){
    const item=this.plan[this.i];if(!item)return this.finish();
    if(item.kind==="rest")return this.rest(item);
    const ex=EXERCISES[item.id],target=this.target(item.id,item);this.phaseAt=Date.now();this.remaining=target;this.reps=target;this.effort="good";
    const effectiveMode=item.modeOverride||ex.mode;
    if(effectiveMode==="time" || item.durationOverride) this.startTimer(item,{...ex,mode:effectiveMode},target);
    else this.hooks.exercise?.({item,ex,target,next:this.nextExercise()});
  }
  startTimer(item,ex,target){
    this.running=true;this.hooks.timer?.({item,ex,target,next:this.nextExercise()});
    this.timer=setInterval(()=>{this.remaining--;this.hooks.tick?.(this.remaining);if(this.remaining<=0){this.stop();this.complete()}},1000)
  }
  completeReps(reps,effort){this.reps=reps;this.effort=effort;this.complete()}
  complete(early=false){this.record(early);this.advance()}
  record(early=false){
    const item=this.plan[this.i];if(!item||item.kind!=="exercise")return;
    const ex=EXERCISES[item.id],target=this.target(item.id,item);
    if(item.track===false||item.warm)return;
    const actual=ex.mode==="reps"?this.reps:(this.remaining<=0?target:Math.max(0,target-this.remaining));
    this.log.push({id:item.id,name:ex.name,mode:ex.mode,target,actual,effort:this.effort,skipped:false,early,adaptive:item.adaptive!==false,phase:item.phase||"Bloc principal"});
  }
  skip(){
    const item=this.plan[this.i];if(item?.kind==="exercise"&&item.track!==false&&!item.warm){const ex=EXERCISES[item.id];this.log.push({id:item.id,name:ex.name,mode:ex.mode,target:this.target(item.id,item),actual:null,effort:"skipped",skipped:true,adaptive:item.adaptive!==false,phase:item.phase||"Bloc principal"})}
    this.stop();this.advance()
  }
  advance(){this.stop();this.i++;if(this.i>=this.plan.length)return this.finish();this.enter()}
  rest(item){
    this.remaining=item.seconds;const next=this.nextExercise(this.i+1);this.hooks.rest?.({seconds:item.seconds,next,nextEx:next?EXERCISES[next.id]:null});
    this.running=true;this.timer=setInterval(()=>{this.remaining--;this.hooks.tick?.(this.remaining);if(this.remaining<=0){this.stop();this.i++;this.countdown()}},1000)
  }
  skipRest(){if(this.plan[this.i]?.kind!=="rest")return;this.stop();this.i++;this.countdown()}
  pause(){const ex=this.ex(),item=this.plan[this.i];const mode=item?.modeOverride||ex?.mode;if(!ex||mode!=="time")return;if(this.running){this.stop();this.hooks.paused?.(true)}else{this.startTimer(this.plan[this.i],ex,this.remaining);this.hooks.paused?.(false)}}
  adapt(){
    const grouped={};
    for(const set of this.log){
      if(set.skipped || set.adaptive===false) continue;
      (grouped[set.id]??=[]).push(set);
    }

    for(const [id,sets] of Object.entries(grouped)){
      const ex=EXERCISES[id];
      let old=this.state.targets[id]??ex.base;
      let next=old;

      const ratios=sets.map(s=>s.actual/s.target);
      const avg=ratios.reduce((a,b)=>a+b,0)/ratios.length;
      const easy=sets.filter(s=>s.effort==="easy").length;
      const hard=sets.filter(s=>s.effort==="hard").length;
      const full=sets.filter(s=>s.actual>=s.target).length;

      // Progression conservatrice : on privilégie l'exécution propre.
      if(ex.mode==="reps"){
        if(avg>=1.08 && easy>=Math.ceil(sets.length/2)) next += ex.step*2;
        else if(avg>=.96 && full>=sets.length-1 && hard===0) next += ex.step;
        else if(avg<.72 || hard===sets.length) next -= ex.step;
      } else {
        if(avg>=1 && hard===0) next += ex.step;
        else if(avg<.75) next -= ex.step;
      }

      this.state.targets[id]=Math.max(ex.min,Math.min(ex.max,next));
    }
  }

  finish(){
    this.stop();this.state.attempts++;
    const counted=!this.state.history.some(h=>h.day===dayKey()&&h.counted)&&!this.redo;
    const oldBests={...this.state.bests};if(counted){
      this.adapt();
      this.state.sessions++;
      if(this.advancesProgram){
        this.state.program.index++;
        this.state.sessionDraft=null;
      }
    }
    const valid=this.log.filter(s=>!s.skipped),records=[];
    for(const s of valid){if(s.actual>(oldBests[s.id]||0))records.push(s);this.state.bests[s.id]=Math.max(this.state.bests[s.id]||0,s.actual)}
    const completion=valid.length?valid.filter(s=>s.actual>=s.target).length/valid.length:0;
    const score=Math.round(completion*100);let xp=Math.round(70+completion*50+(counted?25:0));if(this.redo)xp=Math.round(xp*.45);this.state.xp+=xp;
    if(counted){const today=dayKey(),y=new Date(Date.now()-86400000).toISOString().slice(0,10);this.state.streak=this.state.lastDay===y?this.state.streak+1:(this.state.lastDay===today?this.state.streak:1);this.state.lastDay=today}
    const duration=Math.max(1,Math.round((Date.now()-this.startedAt)/1000));
    const rec={
      date:new Date().toISOString(),day:dayKey(),counted,redo:this.redo,xp,score,duration,
      sessionName:this.plan.meta?.name||"Séance",
      sessionKey:this.plan.meta?.key||"",
      sets:this.log
    };this.state.history.unshift(rec);this.state.history=this.state.history.slice(0,100);save(this.state);
    this.hooks.finished?.({xp,score,records,duration,record:rec})
  }
}
