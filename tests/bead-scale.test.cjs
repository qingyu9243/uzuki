const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('make.js','utf8');
const geometry = vm.runInNewContext(`(${source.slice(source.indexOf('function geometry('),source.indexOf('  function counts('))})`,{byId:{small:{size:6},medium:{size:8},large:{size:10}}});
test('removing beads down to zero never enlarges a normal-size bead',()=>{
  for(let n=0;n<=23;n++){
    const g=geometry(Array(n).fill('medium'));
    assert.equal(g.displayRadius,30);
    assert.equal(34*8/g.displayRadius,34*8/30);
    assert.equal(235/g.displayRadius,235/30,'export uses same stable scale');
  }
});
test('mixed sparse beads keep their 6:8:10 diameter ratio',()=>{
  const g=geometry(['small','medium','large']);
  const sizes=[6,8,10].map(d=>34*d/g.displayRadius);
  assert.ok(Math.abs(sizes[0]/sizes[2]-.6)<1e-10);
  assert.ok(Math.abs(sizes[1]/sizes[2]-.8)<1e-10);
});
test('display floor does not change physical fit calculations',()=>{
  assert.equal(geometry(['small']).inner,null);
  const g=geometry(Array(12).fill('medium'));
  assert.ok(g.radius<30);
  assert.ok(Math.abs(g.inner-(2*Math.PI*(4/Math.sin(Math.PI/12)-4)/10))<1e-9);
  assert.ok(geometry(Array(60).fill('large')).displayRadius>30,'dense designs still fit the canvas');
});
