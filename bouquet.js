'use strict';
const flowers = [
 ['tulip','Pink Tulip',8,'hero','Crochet'],['rose','Blush Rose',9,'hero','Crochet'],['peony','Peony',10,'hero','Crochet'],['lily','Lily',10,'hero','Crochet'],['sunflower','Sunflower',9,'hero','Crochet'],['hydrangea','Hydrangea',9,'hero','Crochet'],['daisy','White Daisy',6,'accent','Fuzzy Stem'],['breath',"Baby’s Breath",4,'accent','Fuzzy Stem'],['lavender','Lavender Sprig',5,'accent','Fuzzy Stem'],['eucalyptus','Eucalyptus',4,'foliage','Fuzzy Stem'],['olive','Olive Leaf',4,'foliage','Fuzzy Stem'],['fern','Fern',4,'foliage','Fuzzy Stem']
].map(([id,name,price,group,material],index)=>({id,name,price,group,material,index}));
const wraps=[['pink','Cream Pink','#e6bac0'],['sage','Sage Green','#aeb78d'],['lavender','Lavender','#c7bed7'],['ivory','Ivory','#e8dcc5']];
const ribbons=[['pink','Organza Pink','#d099a4'],['ivory','Satin Ivory','#dfd1b4'],['sage','Satin Sage','#98a276'],['lavender','Lilac Silk','#b2a0bf']];
const presets={blush:{counts:{tulip:1,rose:1,daisy:2,lavender:3,eucalyptus:2},wrap:'pink',ribbon:'pink'},sunshine:{counts:{sunflower:3,lily:1,daisy:2,olive:2},wrap:'ivory',ribbon:'ivory'},meadow:{counts:{hydrangea:1,lavender:3,breath:2,fern:2,eucalyptus:1},wrap:'sage',ribbon:'sage'}};
const $=selector=>document.querySelector(selector);
let state={...structuredClone(presets.blush),message:'A little bouquet\nfor a brighter day ♡',seed:0};
let category='all',material='all',activePreset='blush',bag=[];
const storageKey='uzuki-bouquet-studio-v1';
const spriteStyle=f=>`background-position:${(f.index%4)*100/3}% ${Math.floor(f.index/4)*50}%`;
const total=()=>flowers.reduce((sum,f)=>sum+f.price*(state.counts[f.id]||0),0);
const count=()=>Object.values(state.counts).reduce((a,b)=>a+b,0);
const announce=text=>{$('#status').textContent=text;};
function sanitize(raw){
 if(!raw||typeof raw!=='object'||!raw.counts||typeof raw.counts!=='object')return null;
 const counts={};let available=36;
 flowers.forEach(f=>{const n=raw.counts[f.id];if(Number.isInteger(n)&&n>0){counts[f.id]=Math.min(n,12,available);available-=counts[f.id];}});
 return {counts,wrap:wraps.some(w=>w[0]===raw.wrap)?raw.wrap:'pink',ribbon:ribbons.some(r=>r[0]===raw.ribbon)?raw.ribbon:'pink',message:typeof raw.message==='string'?raw.message.slice(0,180):'',seed:Number.isInteger(raw.seed)?Math.abs(raw.seed)%100:0};
}
function read(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{announce('Browser storage is unavailable. Your current design is still here.');return false;}}
function renderCatalog(){
 $('#catalog').innerHTML=['hero','accent','foliage'].map(group=>{
 const items=flowers.filter(f=>f.group===group&&(category==='all'||category===group)&&(material==='all'||material===f.material));
 if(!items.length)return '';
 return `<section class="catalog-group"><h3>${{hero:'Hero Flowers',accent:'Accent Flowers',foliage:'Foliage & Greenery'}[group]}</h3><div class="flower-grid">${items.map(f=>`<article class="flower-card"><button class="flower-image" data-add="${f.id}" aria-label="Add ${f.name}, $${f.price}"><span class="sprite" style="${spriteStyle(f)}"></span></button><span class="flower-name">${f.name.replace('Pink ','').replace('Blush ','').replace('White ','').replace(' Sprig','')}</span><span class="flower-price">$${f.price}</span><button class="add-flower" data-add="${f.id}" aria-label="Add ${f.name}">+</button></article>`).join('')}</div></section>`;
 }).join('')||'<p class="intro">No flowers in this material. Try another filter.</p>';
}
function renderSwatches(){
 for(const [type,options] of [['wrap',wraps],['ribbon',ribbons]]){
 $(`#${type}-options`).innerHTML=options.map(([id,name,color])=>`<button class="swatch" data-${type}="${id}" aria-label="${name} ${type}" aria-pressed="${state[type]===id}"><span class="swatch-art"><span class="${type}-sample" style="--color:${color}">${type==='ribbon'?'୨୧':''}</span></span>${name}</button>`).join('');
 }
}
function render(){
 const selected=flowers.filter(f=>state.counts[f.id]);
 $('#selection').innerHTML=selected.map(f=>`<div class="selected-row"><div class="mini-image sprite" style="${spriteStyle(f)}"></div><div class="selected-info"><strong>${f.name}</strong><small>${f.material} · $${f.price}</small></div><div class="quantity"><button data-change="${f.id}" data-delta="-1" aria-label="Decrease ${f.name}">−</button><output aria-label="${f.name} quantity">${state.counts[f.id]}</output><button data-change="${f.id}" data-delta="1" aria-label="Increase ${f.name}">+</button></div><button class="remove" data-remove="${f.id}" aria-label="Remove all ${f.name}">×</button></div>`).join('')||'<p class="intro">Your bouquet is a blank canvas.<br>Choose a flower to begin.</p>';
 $('#total').textContent=`$${total()}`;
 $('#message-preview').textContent=state.message||'A little space for your words…';
 $('#add-bag').disabled=!count();
 $('#save').disabled=!count();
 $('#shuffle').disabled=!count();
 $('#arrangement').hidden=!count();$('#empty-stage').hidden=!!count();
 $('#arrangement').style.setProperty('--wrap',wraps.find(w=>w[0]===state.wrap)[2]);
 $('#arrangement').style.setProperty('--ribbon',ribbons.find(r=>r[0]===state.ribbon)[2]);
 const stems=[];
 // Draw greenery first, then accents and focal blooms, keeping stems tied at one point.
 for(const group of ['foliage','accent','hero']){
 const items=selected.filter(f=>f.group===group).flatMap(f=>Array.from({length:state.counts[f.id]},()=>f));
 items.forEach((f,i)=>{
 const t=items.length===1?0:(i/(items.length-1)-.5);
 const angle=t*(group==='hero'?25:80)+Math.sin(i*2.4+state.seed*2)*9;
 const y=(group==='hero'?48:group==='accent'?15:-12)+Math.sin(i*2.3+state.seed)*22;
 stems.push(`<div class="stem" style="--x:${Math.sin(i*3+state.seed)*13}px;--y:${y}px;--angle:${angle}deg"><div class="sprite" style="${spriteStyle(f)}"></div></div>`);
 });}
 $('#stems').innerHTML=stems.join('');
 $('#arrangement').setAttribute('aria-label',`Bouquet with ${selected.map(f=>`${state.counts[f.id]} ${f.name}`).join(', ')}`);
 $('#preview-list').innerHTML=`<h3>${count()} stems, a little happiness.</h3><ul>${selected.map(f=>`<li>${state.counts[f.id]} × ${f.name} <span style="float:right">$${state.counts[f.id]*f.price}</span></li>`).join('')}</ul>`;
 renderSwatches();
 document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.preset===activePreset)));
}
function change(id,delta){if(!flowers.some(f=>f.id===id))return;if(delta>0&&(count()>=36||(state.counts[id]||0)>=12)){announce('A bouquet holds up to 36 stems, with up to 12 of each flower.');return;}state.counts[id]=Math.max(0,(state.counts[id]||0)+delta);if(!state.counts[id])delete state.counts[id];activePreset='';render();announce(`${count()} stems in your bouquet · estimated total $${total()}`);}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.add)change(b.dataset.add,1);
 if(b.dataset.change)change(b.dataset.change,Number(b.dataset.delta));
 if(b.dataset.remove){delete state.counts[b.dataset.remove];activePreset='';render();announce('Flower removed.');}
 if(b.dataset.category){category=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCatalog();}
 if(b.dataset.material){material=b.dataset.material;document.querySelectorAll('[data-material]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCatalog();}
 if(b.dataset.wrap||b.dataset.ribbon){const type=b.dataset.wrap?'wrap':'ribbon';state[type]=b.dataset[type];activePreset='';render();}
 if(b.dataset.jump){const el=$(`#${b.dataset.jump}`);el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});el.querySelector('button').focus({preventScroll:true});}
 if(b.dataset.view){document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#stage').hidden=b.dataset.view!=='preview';$('#preview-list').hidden=b.dataset.view!=='list';}
 if(b.dataset.preset){activePreset=b.dataset.preset;state={...state,...structuredClone(presets[activePreset]),seed:0};render();announce('A fresh starting point. Make it your own.');}
});
$('#clear').onclick=()=>{state.counts={};activePreset='';render();announce('A fresh canvas. Add a flower to begin.');};
$('#reset').onclick=()=>{state={...state,...structuredClone(presets.blush),seed:0};activePreset='blush';$('#arrangement').style.setProperty('--zoom',1);$('#zoom').setAttribute('aria-pressed','false');render();announce('Returned to the Blush garden arrangement.');};
$('#shuffle').onclick=()=>{state.seed=(state.seed+1)%100;render();announce('A new arrangement, with the same lovely flowers.');};
$('#zoom').onclick=()=>{const zoom=$('#zoom').getAttribute('aria-pressed')!=='true';$('#zoom').setAttribute('aria-pressed',String(zoom));$('#arrangement').style.setProperty('--zoom',zoom?1.2:1);};
$('#edit-message').onclick=()=>{$('#message-input').value=state.message;$('#message-dialog').showModal();$('#message-input').focus();};
$('#apply-message').onclick=()=>{state.message=$('#message-input').value.trim().slice(0,180);$('#message-dialog').close();render();announce('Your message card is ready.');};
$('#save').onclick=()=>{if(write(storageKey,state))announce('Design saved in this browser. Use ♡ at the top to load it.');};
$('#load-design').onclick=()=>{const saved=sanitize(read(storageKey));if(!saved){announce('No saved bouquet yet. Create one and choose Save Design.');return;}state=saved;activePreset='';render();announce('Your saved bouquet is back.');};
function renderBag(){
 $('#bag-count').textContent=bag.length;
 const content=$('#bag-content');content.replaceChildren();
 if(!bag.length){const p=document.createElement('p');p.textContent='Your design bag is waiting for its first bouquet.';content.append(p);}
 bag.forEach((design,i)=>{const div=document.createElement('div');div.className='bag-item';const title=document.createElement('strong');title.textContent=`Bouquet ${i+1}`;const remove=document.createElement('button');remove.textContent='Remove';remove.setAttribute('aria-label',`Remove bouquet ${i+1} from bag`);remove.onclick=()=>{const next=bag.filter((_,n)=>n!==i);if(write(`${storageKey}-bag`,next)){bag=next;renderBag();}};const p=document.createElement('p');p.textContent=flowers.filter(f=>design.counts[f.id]).map(f=>`${design.counts[f.id]} × ${f.name}`).join(' · ');const note=document.createElement('p');note.textContent=design.message;div.append(title,remove,p,note);content.append(div);});
}
$('#add-bag').onclick=()=>{if(!count())return;if(bag.length>=20){announce('Your bag holds 20 designs. Remove one to make room.');return;}const next=[...bag,structuredClone(state)];if(write(`${storageKey}-bag`,next)){bag=next;renderBag();$('#bag-dialog').showModal();announce('Your bouquet was added to your design bag.');}};
$('#open-bag').onclick=()=>{renderBag();$('#bag-dialog').showModal();};$('#close-bag').onclick=()=>$('#bag-dialog').close();
const saved=sanitize(read(storageKey));if(saved){state=saved;activePreset='';}
const storedBag=read(`${storageKey}-bag`);if(Array.isArray(storedBag))bag=storedBag.slice(0,20).map(sanitize).filter(Boolean);
renderCatalog();render();renderBag();
