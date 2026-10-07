import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleCms } from '../worker/cms.js';
import { handleSales, summarize } from '../worker/sales.js';
function setup(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0004_event_sales.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0005_sales_products.sql',import.meta.url),'utf8'));
  const db={prepare(sql){let args=[];return{bind(...values){args=values;return this;},async all(){return{results:sqlite.prepare(sql).all(...args)};},async first(){return sqlite.prepare(sql).get(...args)||null;},async run(){const r=sqlite.prepare(sql).run(...args);return{meta:{changes:r.changes}};}};},async batch(statements){sqlite.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
  const env={CMS_DB:db};
  const catalog=()=>({comics:[{slug:'comic',title:'Comic',cover:'/cover.jpg',chapters:[]}]});
  const call=(path,body,user={role:'admin'})=>{const url=new URL('https://example.com/api/cms/sales'+path);return handleSales(new Request(url,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})}),env,url,user,catalog);};
  return{sqlite,call};
}
test('sales API requires a CMS session',async()=>{
  const url=new URL('https://example.com/api/cms/sales');
  const response=await handleCms(new Request(url),{},url);assert.equal(response.status,401);
});
test('event inventory, payment totals, gifts, idempotency, stock and closing',async()=>{
  const {sqlite,call}=setup();
  try{
    assert.equal((await call('/events',{name:'Test',date:'2026-10-07',openingCash:10000,items:[{id:'comic',price:25000,brought:4}]},{role:'author'})).status,403);
    const created=await call('/events',{name:'Test',date:'2026-10-07',openingCash:10000,items:[{id:'comic',price:25000,brought:4}]});assert.equal(created.status,201);const {id:eventId}=await created.json();
    const records=[];
    for(const method of ['cash','transfer','card','gift']){const body={id:crypto.randomUUID(),eventId,itemId:'comic',method};records.push(body);assert.equal((await call('/movement',body,{role:'admin',username:'admin'})).status,201);}
    assert.equal((await call('/movement',records[0])).status,200);
    assert.equal((await call('/movement',{...records[0],id:crypto.randomUUID()})).status,409);
    let data=await (await call(`/event?id=${eventId}`)).json();assert.equal(data.totals.drawer,35000);assert.equal(data.totals.revenue,75000);assert.equal(data.totals.gift,1);assert.equal(data.totals.sold,3);assert.equal(data.totals.remaining,0);
    assert.equal((await call('/void',{id:records[0].id,eventId},{role:'author'})).status,403);
    assert.equal((await call('/void',{id:records[0].id,eventId})).status,200);
    assert.equal((await call('/void',{id:records[0].id,eventId})).status,409);
    data=await (await call(`/event?id=${eventId}`)).json();assert.equal(data.totals.remaining,1);assert.equal(data.totals.drawer,10000);
    assert.equal((await call('/close',{eventId})).status,200);
    assert.equal((await call('/movement',{...records[0],id:crypto.randomUUID()})).status,409);
    assert.equal((await call('/void',{id:records[1].id,eventId})).status,409);
  }finally{sqlite.close();}
});
test('only one transaction can consume the last copy',async()=>{
  const {sqlite,call}=setup();try{
    const {id:eventId}=await(await call('/events',{name:'Last copy',date:'2026-10-07',openingCash:0,items:[{id:'comic',price:100,brought:1}]})).json();
    const results=await Promise.all(['cash','gift'].map(method=>call('/movement',{id:crypto.randomUUID(),eventId,itemId:'comic',method})));
    assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
    const data=await(await call(`/event?id=${eventId}`)).json();assert.equal(data.items[0].remaining,0);assert.equal(data.movements.length,1);
  }finally{sqlite.close();}
});
test('calculations use integer cents and exclude voided transactions',()=>{
  const result=summarize({opening_cash:10},[{brought:3,remaining:2}],[{method:'cash',amount:29,voided:0},{method:'gift',amount:0,voided:1}]);assert.equal(result.drawer,39);assert.equal(result.gift,0);
});
test('all sales and product operations deny non administrators',async()=>{
  const {sqlite,call}=setup();try{
    for(const path of ['', '/event?id=test','/products','/products/archive','/events','/movement','/void','/close']){
      assert.equal((await call(path,path===''||path.startsWith('/event?')?undefined:{},{role:'author'})).status,403);
    }
  }finally{sqlite.close();}
});
test('reference imports 37 product definitions and no historical inventory',async()=>{
  const {sqlite,call}=setup();try{
    const data=await(await call('')).json();assert.equal(data.products.length,37);assert.equal(data.events.length,0);
    assert.equal(data.products.filter(p=>p.category==='merchandise').length,5);
    const reference=data.products.find(p=>p.id==='product:LIB-001');assert.equal(reference.price,30000);assert.equal(reference.author_percent,60);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM sales_items').get().n,0);
  }finally{sqlite.close();}
});
test('product edits and archival preserve independent event inventories and prices',async()=>{
  const {sqlite,call}=setup();try{
    const product={title:'Llavero nuevo',category:'merchandise',cover:'/image.png',price:15000,author:'Autor',authorPercent:80};
    let response=await call('/products',product);assert.equal(response.status,201);const {id}=await response.json();
    assert.equal((await call('/products',{...product,cover:'javascript:alert(1)'})).status,400);
    const create=async(brought,price)=>(await(await call('/events',{name:'Evento',date:'2026-10-07',openingCash:0,items:[{id,brought,price}]})).json()).id;
    const first=await create(5,15000),second=await create(12,20000);
    assert.equal((await call('/movement',{id:crypto.randomUUID(),eventId:first,itemId:id,method:'cash'})).status,201);
    assert.equal((await call('/products',{...product,id,title:'Llavero actualizado',price:30000})).status,200);
    assert.equal((await call('/products/archive',{id,archived:true})).status,200);
    let data=await(await call('')).json();assert.equal(data.catalog.some(p=>p.id===id),false);
    assert.equal((await call('/events',{name:'Archivado',date:'2026-10-07',openingCash:0,items:[{id,brought:1,price:30000}]})).status,400);
    const a=await(await call(`/event?id=${first}`)).json(),b=await(await call(`/event?id=${second}`)).json();
    assert.equal(a.items[0].remaining,4);assert.equal(b.items[0].remaining,12);assert.equal(a.items[0].price,15000);assert.equal(b.items[0].price,20000);assert.equal(a.items[0].title,'Llavero nuevo');
    assert.equal((await call('/movement',{id:crypto.randomUUID(),eventId:second,itemId:id,method:'gift'})).status,201);
    assert.equal((await call('/products/archive',{id,archived:false})).status,200);
    data=await(await call('')).json();assert.equal(data.catalog.find(p=>p.id===id).price,30000);
  }finally{sqlite.close();}
});
