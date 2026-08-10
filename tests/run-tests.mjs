import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,"..");
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"));

const exercises=read("data/exercises.json").exercises;
const ids=new Set(exercises.map(x=>x.id));
const programs=read("data/programs.json");
const benchmarks=read("data/benchmarks.json");

function compile(blocks){
  const out=[];
  for(const block of blocks){
    if(block.type==="exercise"){
      for(let i=0;i<Math.max(1,Number(block.sets)||1);i++)
        out.push({id:block.exercise_id,restAfter:Number(block.rest_after_sec)||0});
    } else if(block.type==="circuit"||block.type==="superset"){
      const rounds=Math.max(1,Number(block.rounds)||1);
      for(let r=0;r<rounds;r++){
        (block.items||[]).forEach((id,i)=>out.push({
          id,
          restAfter:i===block.items.length-1
            ? (r<rounds-1?(Number(block.rest_between_rounds_sec)||0):0)
            : (Number(block.rest_between_exercises_sec)||0)
        }));
      }
    } else throw new Error(`type inconnu ${block.type}`);
  }
  return out;
}

for(const [level,sessions] of Object.entries(programs.programs)){
  for(const session of sessions){
    const flat=compile(session.blocks);
    assert.ok(flat.length>0,`${level}/${session.key} vide`);
    flat.forEach(x=>assert.ok(ids.has(x.id),`ID ${x.id} absent`));
    assert.equal(flat.at(-1).restAfter,0,"le dernier exercice d'un circuit simple doit finir sans repos final");
  }
}

const custom=compile([
  {type:"superset",rounds:2,rest_between_exercises_sec:15,rest_between_rounds_sec:45,items:["pushups","squat"]},
  {type:"exercise",exercise_id:"plank",sets:2,rest_after_sec:20}
]);
assert.deepEqual(custom.map(x=>x.id),["pushups","squat","pushups","squat","plank","plank"]);
assert.equal(custom[0].restAfter,15);
assert.equal(custom[1].restAfter,45);
assert.equal(custom[3].restAfter,0);
assert.equal(custom[4].restAfter,20);

for(const session of benchmarks.sessions){
  compile(session.blocks).forEach(x=>assert.ok(ids.has(x.id)));
}

console.log("OK — tests de compilation programmes / circuits / supersets / benchmark.");
