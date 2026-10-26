const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('bouquet.js','utf8');
const ctx=vm.createContext({structuredClone});
vm.runInContext(source.slice(0,source.indexOf('function renderArrangement()'))+';this.layout=bouquetLayout;this.presets=presets;this.sanitize=sanitize;this.displayedLayout=displayedLayout;this.setState=value=>state=value;this.freezePositions=freezePositions;this.snapshot=arrangementSnapshot;this.edit=editSelected;this.select=key=>selectedStem=key;this.restore=restoreArrangement;this.undo=()=>restoreArrangement(arrangementHistory.pop());',ctx);
test('layouts preserve all stems and stay within the crown across all seeds',()=>{
 const cases=[{}, {rose:1}, {rose:12}, {rose:12,tulip:12,daisy:12}, ...Object.values(ctx.presets).map(p=>p.counts)];
 for(const counts of cases)for(let seed=0;seed<100;seed++){
 const result=ctx.layout(counts,seed);
 assert.equal(result.length,Object.values(counts).reduce((a,b)=>a+b,0));
 assert.equal(new Set(result.map(s=>s.key)).size,result.length);
 for(const s of result){assert.ok(s.x>=80&&s.x<=360);assert.ok(s.y>70&&s.y<310);assert.ok(Number.isFinite(s.angle)&&Math.abs(s.angle)<50);assert.ok(s.height>150&&s.height<500);}
 }
});
test('saved seed reproduces arrangement, and Arrange changes composition',()=>{
 const counts=ctx.presets.blush.counts;
 assert.equal(JSON.stringify(ctx.layout(counts,8)),JSON.stringify(ctx.layout(counts,8)));
 assert.notEqual(JSON.stringify(ctx.layout(counts,8)),JSON.stringify(ctx.layout(counts,9)));
});
test('adding another instance preserves earlier same-material positions',()=>{
 const before=ctx.layout({rose:3},0),after=ctx.layout({rose:4},0);
 assert.equal(JSON.stringify(before),JSON.stringify(after.slice(0,3)));
});

test('manual placement survives save/load, with roots fixed and neighbors preserved',()=>{
 const initial={...ctx.presets.blush,seed:0,positions:{}};
 ctx.setState(initial);const before=ctx.displayedLayout();ctx.freezePositions();
 initial.positions['rose-0']={x:310,y:140};
 const moved=ctx.displayedLayout(),rose=moved.find(s=>s.key==='rose-0'),oldRose=before.find(s=>s.key==='rose-0');
 assert.equal(rose.x,310);assert.equal(rose.y,140);assert.equal(rose.rootX,oldRose.rootX);assert.equal(rose.rootY,oldRose.rootY);
 for(const item of moved.filter(s=>s.key!=='rose-0')){const old=before.find(s=>s.key===item.key);assert.equal(item.x,old.x);assert.equal(item.y,old.y);}
 const saved=ctx.sanitize(JSON.parse(JSON.stringify(initial)));ctx.setState(saved);
 assert.equal(JSON.stringify(ctx.displayedLayout()),JSON.stringify(moved));
});
test('invalid saved positions are discarded and out-of-bounds positions are limited',()=>{
 const saved=ctx.sanitize({counts:{rose:2},positions:{'rose-0':{x:-1000,y:2000},'rose-1':{x:NaN,y:20},'fern-0':{x:100,y:100}}});
 assert.equal(saved.positions['rose-0'].x,80);assert.equal(saved.positions['rose-0'].y,295);
 assert.equal(Object.keys(saved.positions).length,1);
 assert.equal(Object.keys(ctx.sanitize({counts:{rose:1}}).positions).length,0);
});
test('arrangement snapshots restore manual moves without sharing mutable positions',()=>{
 const design={...ctx.presets.blush,seed:3,positions:{'rose-0':{x:200,y:160}}};ctx.setState(design);
 const snapshot=ctx.snapshot();design.positions['rose-0'].x=300;design.seed=4;
 assert.equal(snapshot.positions['rose-0'].x,200);assert.equal(snapshot.seed,3);
});

test('dragging near or far changes stem reach, never flower artwork dimensions',()=>{
 const design={...ctx.presets.blush,seed:0,positions:{}};ctx.setState(design);
 const original=ctx.displayedLayout().find(s=>s.key==='rose-0');
 for(const point of [{x:220,y:295},{x:80,y:95},{x:360,y:95}]){
 design.positions['rose-0']=point;
 const moved=ctx.displayedLayout().find(s=>s.key==='rose-0');
 assert.equal(moved.width,original.width);assert.equal(moved.height,original.height);
 const radians=moved.angle*Math.PI/180;
 assert.ok(Math.abs(moved.x-Math.sin(radians)*moved.stemLength-moved.rootX)<1e-8);
 assert.ok(Math.abs(moved.y+Math.cos(radians)*moved.stemLength-moved.rootY)<1e-8);
 }
});

test('copy preserves artwork, increments quantity, and undo restores the design',()=>{
 const design={...ctx.presets.blush,counts:{rose:1},seed:0,positions:{}};ctx.setState(design);ctx.select('rose-0');
 const before=ctx.displayedLayout()[0];assert.equal(ctx.edit('copy'),true);
 const copy=ctx.displayedLayout().find(s=>s.key==='rose-1');assert.equal(design.counts.rose,2);
 assert.equal(copy.width,before.width);assert.equal(copy.height,before.height);assert.notEqual(copy.x,before.x);
 ctx.undo();assert.equal(design.counts.rose,1);assert.equal(ctx.displayedLayout().length,1);
});
test('delete removes the chosen instance and preserves remaining positions and sizes',()=>{
 const design={...ctx.presets.blush,counts:{rose:3},seed:0,positions:{'rose-0':{x:100,y:150},'rose-1':{x:200,y:170},'rose-2':{x:300,y:190}}};ctx.setState(design);
 const before=ctx.displayedLayout();ctx.select('rose-1');ctx.edit('delete');const after=ctx.displayedLayout();
 assert.equal(after.length,2);assert.equal(after[1].x,300);assert.equal(after[1].width,before[2].width);assert.equal(after[1].height,before[2].height);
 ctx.undo();assert.equal(design.counts.rose,3);assert.equal(ctx.displayedLayout()[1].x,200);
});
test('layer ordering survives save/load and can be undone',()=>{
 const design={...ctx.presets.blush,counts:{rose:1,fern:1},seed:0,positions:{}};ctx.setState(design);ctx.select('fern-0');ctx.edit('front');
 let layout=ctx.displayedLayout();assert.ok(layout.find(s=>s.key==='fern-0').depth>layout.find(s=>s.key==='rose-0').depth);
 const saved=ctx.sanitize(JSON.parse(JSON.stringify(design)));assert.equal(saved.layerOrder.at(-1),'fern-0');ctx.setState(saved);
 ctx.edit('back');layout=ctx.displayedLayout();assert.ok(layout.find(s=>s.key==='fern-0').depth<layout.find(s=>s.key==='rose-0').depth);
 ctx.undo();assert.equal(saved.layerOrder.at(-1),'fern-0');
});
