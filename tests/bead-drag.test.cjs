const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function harness(initial = ['a','b','c']) {
  class Element {
    constructor() { this.style={};this.handlers={};this.children=[];this.classes=new Set();this.classList={add:(...s)=>s.forEach(x=>this.classes.add(x)),remove:(...s)=>s.forEach(x=>this.classes.delete(x)),toggle:(s,on)=>on?this.classes.add(s):this.classes.delete(s)}; }
    setAttribute() {} append(...els) {this.children.push(...els);} remove() {} addEventListener(type,fn) {(this.handlers[type]??=[]).push(fn);}
    emit(type,fields={}) {const e={isPrimary:true,button:0,pointerId:1,pointerType:'mouse',clientX:250,clientY:100,target:this,preventDefault(){},...fields};for(const fn of this.handlers[type]||[])fn(e);}
    setPointerCapture() {this.captured=true;} hasPointerCapture(){return this.captured;} releasePointerCapture(){this.captured=false;this.emit('lostpointercapture');}
    getBoundingClientRect() {return this.className==='bead-drop-bin'?{left:200,right:400,top:700,bottom:780}:{left:0,right:500,top:0,bottom:500,width:500,height:500};}
    querySelector(){return new Element();} closest(){return this;}
  }
  const document=new Element();document.body=new Element();document.createElement=()=>new Element();
  const window=new Element();window.scrollBy=()=>{};
  const context={window,document,innerHeight:800,requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}};
  vm.runInNewContext(fs.readFileSync('bead-drag.js','utf8'),context);
  let beads=initial.slice(),commits=0,status='';
  const editor=window.createBeadDrag({stage:new Element(),getBeads:()=>beads,geometry:ids=>({radius:30,displayRadius:30,angles:ids.map((_,i)=>i*2*Math.PI/ids.length)}),swatch:()=>new Element(),material:()=>({size:8}),commit:next=>{beads=Array.from(next);commits++;},announce:text=>status=text});
  const source=new Element();
  return {editor,source,document,window,get beads(){return beads},get commits(){return commits},get status(){return status}};
}
function gesture(h, id, index, x, y) {
  h.editor.bind(h.source,id,index);h.source.emit('pointerdown');h.source.emit('pointermove',{clientX:x,clientY:y});h.source.emit('pointerup',{clientX:x,clientY:y});
}
test('tray insertion is one commit, with no duplicate click',()=>{const h=harness();gesture(h,'d',null,450,250);assert.equal(h.commits,1);assert.deepEqual(h.beads,['a','d','b','c']);let prevented=false;h.document.emit('click',{detail:1,preventDefault(){prevented=true;},stopImmediatePropagation(){}});assert.ok(prevented);});
test('reorder removes the source before inserting, preserving all other beads',()=>{const h=harness();gesture(h,'a',0,250,450);assert.equal(h.commits,1);assert.deepEqual(h.beads,['b','a','c']);});
test('remove zone deletes only existing beads',()=>{const h=harness();gesture(h,'b',1,300,740);assert.deepEqual(h.beads,['a','c']);assert.equal(h.commits,1);const tray=harness();gesture(tray,'d',null,300,740);assert.equal(tray.commits,0);});
test('outside ring and central hole remove existing beads',()=>{for(const [x,y] of [[600,300],[250,250],[490,490]]){const h=harness();gesture(h,'a',0,x,y);assert.equal(h.commits,1);assert.deepEqual(h.beads,['b','c']);assert.match(h.status,/removed/);}});
test('tray outside drop and tiny movement do not commit',()=>{const h=harness();gesture(h,'d',null,600,300);assert.equal(h.commits,0);const tap=harness();gesture(tap,'a',0,252,102);assert.equal(tap.commits,0);});
test('dragging into hole then back to ring reorders without deleting',()=>{const h=harness();h.editor.bind(h.source,'a',0);h.source.emit('pointerdown');h.source.emit('pointermove',{clientX:250,clientY:250});assert.equal(h.commits,0);h.source.emit('pointermove',{clientX:250,clientY:450});h.source.emit('pointerup',{clientX:250,clientY:450});assert.deepEqual(h.beads,['b','a','c']);assert.equal(h.commits,1);});
for(const event of ['pointercancel','lostpointercapture','Escape','blur'])test(`${event} cancels preview without mutation`,()=>{const h=harness();h.editor.bind(h.source,'a',0);h.source.emit('pointerdown');h.source.emit('pointermove',{clientX:400,clientY:300});if(event==='Escape')h.document.emit('keydown',{key:'Escape'});else if(event==='blur')h.window.emit('blur');else h.source.emit(event);assert.equal(h.commits,0);assert.deepEqual(h.beads,['a','b','c']);});
test('empty ring accepts first bead and 60 bead cap rejects insertion',()=>{const h=harness([]);gesture(h,'a',null,250,250);assert.deepEqual(h.beads,['a']);const full=harness(Array(60).fill('a'));gesture(full,'b',null,450,250);assert.equal(full.commits,0);assert.match(full.status,/60 beads/);});
test('touch tray text remains scrollable; image dragging works',()=>{const h=harness();h.editor.bind(h.source,'d');h.source.emit('pointerdown',{pointerType:'touch',target:{closest:()=>null}});h.source.emit('pointermove',{clientX:450,clientY:250});h.source.emit('pointerup');assert.equal(h.commits,0);h.source.emit('pointerdown',{pointerType:'touch'});h.source.emit('pointermove',{pointerType:'touch',clientX:450,clientY:250});h.source.emit('pointerup',{pointerType:'touch',clientX:450,clientY:250});assert.equal(h.commits,1);});
