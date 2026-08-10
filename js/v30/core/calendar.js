
export function startOfDay(date=new Date()){
  return new Date(date.getFullYear(),date.getMonth(),date.getDate());
}
export function localDayKey(date=new Date()){
  const d=startOfDay(date);
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
export function parseLocalDayKey(key){
  const [y,m,d]=String(key).split("-").map(Number);
  return new Date(y,m-1,d);
}
export function addDays(date,days){
  const d=startOfDay(date);d.setDate(d.getDate()+days);return d;
}
export function mondayOfWeek(date=new Date()){
  const d=startOfDay(date),offset=(d.getDay()+6)%7;
  return addDays(d,-offset);
}
export function isRestDay(date,restDay=0){ return startOfDay(date).getDay()===Number(restDay) }

export function buildRollingSchedule({
  today=new Date(),programIndex=0,programs=[],restDay=0,todayDone=false,days=400
}={}){
  const out=[],base=startOfDay(today);
  let index=Math.max(0,Number(programIndex)||0);
  const list=Array.isArray(programs)?programs:[];
  for(let i=0;i<days;i++){
    const date=addDays(base,i),key=localDayKey(date);
    if(isRestDay(date,restDay)){
      out.push({key,date,type:"rest"});
      continue;
    }
    if(i===0 && todayDone){
      out.push({key,date,type:"done-today"});
      continue;
    }
    const template=list.length?list[index%list.length]:null;
    out.push({
      key,date,type:"planned",programIndex:index,
      template,
      cycle:Math.floor(index/24)+1,
      position:index%24,
      week:template?.week||Math.floor((index%24)/6)+1,
      day:template?.day||((index%6)+1)
    });
    index++;
  }
  return out;
}

export function monthCells(year,month){
  const first=new Date(year,month,1);
  const offset=(first.getDay()+6)%7; // Monday first
  const start=addDays(first,-offset);
  return Array.from({length:42},(_,i)=>addDays(start,i));
}

export function formatShortDate(date){
  return new Intl.DateTimeFormat("fr-FR",{weekday:"short",day:"numeric",month:"short"}).format(date);
}
export function formatLongDate(date){
  const raw=new Intl.DateTimeFormat("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).format(date);
  return raw.charAt(0).toUpperCase()+raw.slice(1);
}
