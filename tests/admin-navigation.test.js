import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Exercise the real client router without requiring a browser or production credentials.
function loadAdmin() {
  const nodes = new Map();
  const node = key => {
    if (!nodes.has(key)) nodes.set(key, { hidden:false, dataset:{}, addEventListener(){}, focus(){}, classList:{toggle(){}} });
    return nodes.get(key);
  };
  const location = {pathname:'/admin'};
  const context = vm.createContext({
    document:{querySelector:node, querySelectorAll(selector){
      return selector.split(',').map(part => node(part.trim()));
    }, addEventListener(){}},
    window:{addEventListener(){}}, location,
    history:{pushState(_state,_title,path){location.pathname=path;}, replaceState(_state,_title,path){location.pathname=path;}},
    fetch:async()=>({ok:true,status:200,json:async()=>({authenticated:false})}),
    AbortSignal, console, setTimeout, clearTimeout, structuredClone,
  });
  vm.runInContext(readFileSync(new URL('../public/admin.js', import.meta.url),'utf8'),context);
  vm.runInContext(`
    const views=[];
    renderPasswordChange = required => views.push(['password',required]);
    renderCatalog = type => views.push(['catalog',type]);
    openEditor = () => views.push(['editor']);
    renderEditor = () => views.push(['profile']);
  `,context);
  return {context,nodes,location,run:code=>vm.runInContext(code,context)};
}

test('pending temporary password cannot navigate into empty comic or creator catalogs',async()=>{
  const ui=loadAdmin();
  await ui.run(`openCms({role:'author',username:'froggynami',authorSlug:'froggynami',mustChangePassword:true})`);
  assert.equal(ui.location.pathname,'/admin/password');
  assert.equal(ui.run('state.content'),null);
  for(const path of ['/admin/comics','/admin/creators','/admin/creators/froggynami']){
    ui.run(`navigate('${path}')`);
    assert.equal(ui.location.pathname,'/admin/password');
  }
  assert.equal(ui.run(`views.every(([view,required])=>view==='password'&&required===true)`),true);
  assert.equal(ui.nodes.get('[data-route="comics"]').hidden,true);
  assert.equal(ui.nodes.get('[data-route="creators"]').hidden,true);
  assert.equal(ui.nodes.get('[data-author-only]').hidden,false);

  ui.location.pathname='/admin/comics';
  await ui.run(`
    api=async()=>({comics:[{slug:'how-to-hide-a-mermaid'}],authors:[{slug:'froggynami'}],projects:[]});
    openCms({role:'author',username:'froggynami',authorSlug:'froggynami',mustChangePassword:false});
  `);
  assert.equal(ui.run(`allRecords('comics')[0].slug`),'how-to-hide-a-mermaid');
  assert.equal(ui.run(`allRecords('authors')[0].slug`),'froggynami');
  assert.equal(ui.run(`views.at(-1).join(':')`),'catalog:comics');
  ui.run(`navigate('/admin/creators')`);
  assert.equal(ui.run(`views.at(-1).join(':')`),'profile');
  assert.equal(ui.run(`state.editing.original.slug`),'froggynami');
  assert.equal(ui.nodes.get('[data-route="comics"]').hidden,false);
  assert.equal(ui.nodes.get('[data-route="creators"]').hidden,false);
});
