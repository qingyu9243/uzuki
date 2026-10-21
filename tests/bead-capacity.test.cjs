const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('make.js','utf8');
const geometry=source.slice(source.indexOf('  function geometry('),source.indexOf('  function counts('));
const policy=source.slice(source.indexOf('  function canEditBeads('),source.indexOf('  function change('));
const canEdit=vm.runInNewContext(`(()=>{${geometry}${policy};return canEditBeads;})()`,{byId:{s:{size:6},m:{size:8},l:{size:10}}});
test('15 cm wrist accepts 24 standard beads but rejects the 25th',()=>{assert.ok(canEdit(Array(23).fill('m'),Array(24).fill('m'),15));assert.equal(canEdit(Array(24).fill('m'),Array(25).fill('m'),15),false);});
test('larger wrist allows a longer bracelet',()=>{assert.ok(canEdit(Array(24).fill('m'),Array(25).fill('m'),17));});
test('oversized saved drafts may shrink or reorder, but cannot grow',()=>{const before=Array(30).fill('m');assert.ok(canEdit(before,before.slice(1),15));assert.ok(canEdit(before,before.slice(),15));assert.ok(canEdit(before,['s',...before.slice(1)],15));assert.equal(canEdit(before,['l',...before.slice(1)],15),false);assert.equal(canEdit(before,[...before,'s'],15),false);});
test('empty drafts accept beads and retain technical cap',()=>{assert.ok(canEdit([],['l'],12));assert.equal(canEdit(Array(60).fill('s'),Array(61).fill('s'),22),false);});
