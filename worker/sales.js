const reply = (body, status=200) => new Response(JSON.stringify(body), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const integer = value => Number.isSafeInteger(value) && value >= 0 && value <= 100000000;
function validCover(value) {
  if(/^\/(?!\/)/.test(value))return !/[\\\u0000-\u0020]/.test(value);
  try {const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;} catch{return false;}
}
export function salesCatalog(comics,products) {
  const linked=new Set(products.map(p=>p.catalog_id).filter(Boolean));
  const builtin=comics.flatMap(c=>[{id:c.slug,title:c.title,cover:c.cover||'',price:0},...(c.chapters||[]).map((ch,index)=>({id:`${c.slug}::${ch.id||ch.number||index+1}`,legacyId:`${c.slug}::${ch.number||index+1}`,title:`${c.title} · ${ch.title||`Capítulo ${ch.number||index+1}`}`,cover:ch.cover||c.cover||'',price:0}))]).filter(c=>!linked.has(c.id)&&!linked.has(c.legacyId));
  return [...products.filter(p=>!p.archived),...builtin].sort((a,b)=>a.title.localeCompare(b.title,'es'));
}
export function summarize(event, items, movements) {
  const totals = {cash:0,transfer:0,card:0,gift:0,sold:0,brought:items.reduce((n,i)=>n+i.brought,0),remaining:items.reduce((n,i)=>n+i.remaining,0)};
  for (const movement of movements.filter(m=>!m.voided)) {
    if(movement.method==='gift') totals.gift++;
    else { totals[movement.method]+=movement.amount; totals.sold++; }
  }
  totals.revenue=totals.cash+totals.transfer+totals.card;
  totals.drawer=event.opening_cash+totals.cash;
  return totals;
}
export async function handleSales(request, env, url, user, getContent) {
  if(user.role!=='admin') return reply({error:'Solo administración puede acceder a ventas e inventario.'},403);
  if (!env.CMS_DB) return reply({error:'Falta la base de datos del CMS.'},503);
  const db=env.CMS_DB;
  const path=url.pathname.slice('/api/cms/sales'.length);
  try {
    if (request.method==='GET' && path==='') {
      const {results:events}=await db.prepare('SELECT * FROM sales_events ORDER BY date DESC, rowid DESC').all();
      const {results:products}=await db.prepare('SELECT * FROM sales_products ORDER BY title').all();
      const comics=(await getContent()).comics;
      return reply({events,products,catalog:salesCatalog(comics,products)});
    }
    if (request.method==='GET' && path==='/event') {
      const id=url.searchParams.get('id');
      const event=await db.prepare('SELECT * FROM sales_events WHERE id=?').bind(id).first();
      if(!event) return reply({error:'Evento no encontrado.'},404);
      const {results:items}=await db.prepare('SELECT * FROM sales_items WHERE event_id=? ORDER BY title').bind(id).all();
      const {results:movements}=await db.prepare('SELECT * FROM sales_movements WHERE event_id=? ORDER BY created_at DESC,rowid DESC').bind(id).all();
      return reply({event,items,movements,totals:summarize(event,items,movements)});
    }
    if(request.method!=='POST') return reply({error:'Método no permitido.'},405);
    if(Number(request.headers.get('content-length')||0)>100000) return reply({error:'Solicitud demasiado grande.'},413);
    let body; try {body=await request.json();} catch {return reply({error:'JSON inválido.'},400);}
    if(!body || typeof body!=='object' || Array.isArray(body)) return reply({error:'Solicitud inválida.'},400);
    if(path==='/products') {
      if(typeof body.title!=='string' || !body.title.trim() || body.title.length>160 || !integer(body.price) || !['comic','merchandise','other'].includes(body.category) || typeof body.cover!=='string' || body.cover.length>2000 || (body.cover && !validCover(body.cover))) return reply({error:'Revisa el nombre, categoría, imagen y precio del producto.'},400);
      if(typeof body.author!=='string' || body.author.length>160 || !Number.isInteger(body.authorPercent) || body.authorPercent<0 || body.authorPercent>100) return reply({error:'Revisa autor y porcentaje (0 a 100).'},400);
      const id=body.id||`product:${crypto.randomUUID()}`;
      if(typeof id!=='string' || !/^product:[a-zA-Z0-9-]{1,50}$/.test(id)) return reply({error:'Producto inválido.'},400);
      if(body.id) {
        const result=await db.prepare('UPDATE sales_products SET title=?,category=?,cover=?,price=?,author=?,author_percent=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(body.title.trim(),body.category,body.cover,body.price,body.author.trim(),body.authorPercent,id).run();
        if(!result.meta.changes)return reply({error:'Producto no encontrado.'},404);
      } else {
        await db.prepare('INSERT INTO sales_products(id,title,category,cover,price,author,author_percent) VALUES(?,?,?,?,?,?,?)').bind(id,body.title.trim(),body.category,body.cover,body.price,body.author.trim(),body.authorPercent).run();
      }
      return reply({id},body.id?200:201);
    }
    if(path==='/products/archive') {
      if(typeof body.id!=='string'||typeof body.archived!=='boolean')return reply({error:'Producto inválido.'},400);
      const result=await db.prepare('UPDATE sales_products SET archived=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(body.archived?1:0,body.id).run();
      return result.meta.changes?reply({ok:true}):reply({error:'Producto no encontrado.'},404);
    }
    if(path==='/events') {
      if(user.role!=='admin') return reply({error:'Solo administración puede preparar eventos.'},403);
      if(!body || typeof body.name!=='string' || !body.name.trim() || body.name.length>120 || !/^\d{4}-\d{2}-\d{2}$/.test(body.date) || !integer(body.openingCash) || !Array.isArray(body.items) || !body.items.length || body.items.length>500) return reply({error:'Revisa nombre, fecha, caja e inventario.'},400);
      const {results:products}=await db.prepare('SELECT * FROM sales_products ORDER BY title').all();
      const catalog=salesCatalog((await getContent()).comics,products);
      const unique=new Set(); const items=[];
      for(const input of body.items) {
        if(!input || typeof input!=='object') return reply({error:'Inventario inválido.'},400);
        const record=catalog.find(c=>c.id===input.id);
        if(!record || unique.has(input.id) || !integer(input.price) || !integer(input.brought) || !input.brought) return reply({error:'Inventario o precio inválido.'},400);
        unique.add(input.id); items.push({...record,price:input.price,brought:input.brought});
      }
      const id=crypto.randomUUID();
      await db.batch([db.prepare('INSERT INTO sales_events(id,name,date,opening_cash) VALUES(?,?,?,?)').bind(id,body.name.trim(),body.date,body.openingCash),...items.map(i=>db.prepare('INSERT INTO sales_items(event_id,id,title,cover,price,brought,remaining) VALUES(?,?,?,?,?,?,?)').bind(id,i.id,i.title,i.cover,i.price,i.brought,i.brought))]);
      return reply({id},201);
    }
    if(path==='/movement') {
      if(!body || typeof body.id!=='string' || !/^[0-9a-f-]{36}$/i.test(body.id) || !['cash','transfer','card','gift'].includes(body.method)) return reply({error:'Movimiento inválido.'},400);
      const existing=await db.prepare('SELECT * FROM sales_movements WHERE id=?').bind(body.id).first();
      if(existing) return existing.event_id===body.eventId && existing.item_id===body.itemId && existing.method===body.method ? reply({ok:true}) : reply({error:'Identificador duplicado.'},409);
      const item=await db.prepare('SELECT * FROM sales_items WHERE event_id=? AND id=?').bind(body.eventId,body.itemId).first();
      if(!item) return reply({error:'Obra no encontrada.'},404);
      if(body.method!=='gift' && item.price<=0) return reply({error:'La obra no tiene precio de venta.'},400);
      await db.prepare('INSERT INTO sales_movements(id,event_id,item_id,method,amount,actor) VALUES(?,?,?,?,?,?)').bind(body.id,body.eventId,body.itemId,body.method,body.method==='gift'?0:item.price,user.username||user.authorSlug||'Administración').run();
      return reply({ok:true},201);
    }
    if(path==='/void' || path==='/close') {
      if(user.role!=='admin') return reply({error:'Solo administración puede anular o cerrar.'},403);
      if(path==='/close') {
        const result=await db.prepare('UPDATE sales_events SET closed=1 WHERE id=?').bind(body.eventId).run();
        return result.meta.changes?reply({ok:true}):reply({error:'Evento no encontrado.'},404);
      }
      const result=await db.prepare('UPDATE sales_movements SET voided=1 WHERE id=? AND event_id=? AND voided=0 AND EXISTS(SELECT 1 FROM sales_events WHERE id=? AND closed=0)').bind(body.id,body.eventId,body.eventId).run();
      return result.meta.changes?reply({ok:true}):reply({error:'El movimiento ya está anulado o el evento está cerrado.'},409);
    }
    return reply({error:'No encontrado.'},404);
  } catch(error) {
    if(String(error).includes('stock_or_closed')) return reply({error:'Sin existencias o evento cerrado. Actualiza el inventario.'},409);
    console.error('Sales request failed',error);
    return reply({error:'No se pudo guardar. Revisa la conexión y las migraciones del CMS.'},503);
  }
}
