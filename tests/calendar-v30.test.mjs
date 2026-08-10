import assert from "node:assert/strict";
import {buildRollingSchedule,localDayKey,monthCells} from "../js/v30/core/calendar.js";

const programs=Array.from({length:24},(_,i)=>({key:`S${i+1}`,name:`Séance ${i+1}`,week:Math.floor(i/6)+1,day:i%6+1}));
const monday=new Date(2026,7,10); // Mon 10 Aug 2026
const schedule=buildRollingSchedule({today:monday,programIndex:0,programs,restDay:0,todayDone:false,days:8});
assert.equal(schedule[0].type,"planned");
assert.equal(schedule[0].template.key,"S1");
assert.equal(schedule[5].template.key,"S6");
assert.equal(schedule[6].type,"rest"); // Sunday
assert.equal(schedule[7].template.key,"S7");

const done=buildRollingSchedule({today:monday,programIndex:1,programs,restDay:0,todayDone:true,days:3});
assert.equal(done[0].type,"done-today");
assert.equal(done[1].template.key,"S2");

assert.equal(localDayKey(monday),"2026-08-10");
assert.equal(monthCells(2026,7).length,42);
console.log("OK — V30 rolling calendar.");
