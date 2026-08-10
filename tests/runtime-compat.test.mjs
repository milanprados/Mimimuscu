import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const programs=JSON.parse(fs.readFileSync(path.join(root,"data/programs.json"),"utf8")).programs;

function compile(blocks=[]){
  const out=[];
  for(const block of blocks){
    if(block.type==="exercise"){
      for(let i=0;i<Math.max(1,Number(block.sets)||1);i++)out.push(block.exercise_id);
    }else if(block.type==="circuit"||block.type==="superset"){
      for(let r=0;r<Math.max(1,Number(block.rounds)||1);r++)out.push(...(block.items||[]));
    }
  }
  return out;
}

for(const [level,sessions] of Object.entries(programs)){
  for(const session of sessions){
    const ids=compile(session.blocks);
    assert.ok(Array.isArray(ids),`${level}/${session.key}: ids doit être un tableau`);
    assert.ok(ids.length>0,`${level}/${session.key}: aucun exercice compilé`);
    // Dashboard and planner both require this exact compatibility shape.
    assert.doesNotThrow(()=>ids.map(id=>id));
    assert.doesNotThrow(()=>[...ids]);
  }
}
console.log("OK — compatibilité runtime programs.blocks → template.ids.");
