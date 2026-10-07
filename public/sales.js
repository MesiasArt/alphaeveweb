const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('es-DO',{style:'currency',currency:'DOP'}).format(n/100);
const names={cash:'Efectivo',transfer:'Transferencia',card:'Tarjeta',gift:'Regalo'};
let user, catalog=[],products=[],events=[], current, selected, busy=false, pending;
async function api(path='',body){
  const response=await fetch(`/api/cms/sales${path}`,{credentials:'same-origin',cache:'no-store',...(body?{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'No se pudo completar la operación.');
  return data;
}
function notice(error){$('#notice').textContent=error.message||error;}
function fallbackImages(root){root.querySelectorAll('img').forEach(img=>{img.onerror=()=>{img.onerror=null;img.src='/sales-product-placeholder.svg';};});}
let editingProduct=null, savingProduct=false;
function productMarkup(){
  return `<section id="productos" class="panel"><div class="toolbar"><h2>Productos de venta</h2><button id="add-product" class="primary">+ Agregar producto</button></div><p>Catálogo privado para tus eventos. Puedes agregar cómics, ediciones, llaveros, botones y otros productos. Cada nuevo evento comienza con cantidades en cero.</p><div class="grid">${products.map(p=>`<article class="comic product-card"><img src="${esc(p.cover||'/sales-product-placeholder.svg')}" alt="${esc(p.title)}" loading="lazy"><strong>${esc(p.title)}</strong><span>${money(p.price)} · ${p.category==='comic'?'Cómic':p.category==='merchandise'?'Mercancía':'Otro'} ${p.archived?'· Archivado':''}</span>${p.author?`<small>${esc(p.author)} · ${p.author_percent}%</small>`:''}<div class="toolbar"><button data-edit-product="${esc(p.id)}">Editar</button><button data-archive-product="${esc(p.id)}">${p.archived?'Restaurar':'Archivar'}</button></div></article>`).join('')}</div></section>`;
}
function bindProducts(){
  fallbackImages($('#productos'));
  $('#add-product').onclick=()=>openProduct();
  document.querySelectorAll('[data-edit-product]').forEach(button=>button.onclick=()=>openProduct(products.find(p=>p.id===button.dataset.editProduct)));
  document.querySelectorAll('[data-archive-product]').forEach(button=>button.onclick=async()=>{const product=products.find(p=>p.id===button.dataset.archiveProduct);button.disabled=true;try{await api('/products/archive',{id:product.id,archived:!product.archived});location.hash='productos';await start();notice(product.archived?'Producto restaurado.':'Producto archivado. Los eventos anteriores conservan su inventario.');}catch(error){notice(error);button.disabled=false;}});
}
function openProduct(product=null){
  editingProduct=product;const form=$('#product-form');form.reset();
  for(const name of ['title','category','cover','author'])if(product)form.elements[name].value=product[name];
  form.elements.price.value=product?product.price/100:0;form.elements.authorPercent.value=product?.author_percent||0;
  $('#product-title').textContent=product?'Editar producto':'Agregar producto';$('#product-message').textContent='';$('#product-dialog').showModal();
}
$('#product-cancel').onclick=()=>{if(!savingProduct)$('#product-dialog').close();};
$('#product-dialog').addEventListener('cancel',event=>{if(savingProduct)event.preventDefault();});
$('#product-form').onsubmit=async event=>{
  event.preventDefault();if(savingProduct)return;savingProduct=true;$('#product-save').disabled=true;$('#product-cancel').disabled=true;
  const form=event.currentTarget;const values=new FormData(form);
  try{
    let cover=String(values.get('cover')).trim();const file=$('#product-image').files[0];
    if(file){const upload=new FormData();upload.set('file',file);const response=await fetch('/api/cms/media',{method:'POST',credentials:'same-origin',body:upload});const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo subir la imagen.');cover=result.url;form.elements.cover.value=cover;$('#product-image').value='';}
    await api('/products',{...(editingProduct?{id:editingProduct.id}:{}),title:String(values.get('title')).trim(),category:values.get('category'),price:Math.round(Number(values.get('price'))*100),cover,author:String(values.get('author')).trim(),authorPercent:Number(values.get('authorPercent'))});
    $('#product-dialog').close();location.hash='productos';await start();notice('Producto guardado. Ya puedes incluirlo en un nuevo evento.');
  }catch(error){$('#product-message').textContent=error.message;}
  finally{savingProduct=false;$('#product-save').disabled=false;$('#product-cancel').disabled=false;}
};
async function start(){
  try{
    const session=await fetch('/api/cms/session',{cache:'no-store'}).then(r=>r.json());
    if(!session.authenticated){$('#workspace').innerHTML='<div class="panel"><h1>Acceso del equipo</h1><p>Inicia sesión en el CMS y entra en «Ventas en eventos».</p><a href="/admin">Iniciar sesión</a></div>';return;}
    user=session.user;
    if(user.mustChangePassword){$('#workspace').innerHTML='<p>Cambia tu contraseña temporal antes de registrar ventas.</p><a href="/admin/password">Cambiar contraseña</a>';return;}
    if(user.role!=='admin'){$('#workspace').innerHTML='<div class="panel"><h1>Acceso solo para administradores</h1><p>Ventas, productos e inventario requieren una cuenta de administración.</p><a href="/admin">Volver al CMS</a></div>';return;}
    const data=await api();events=data.events;catalog=data.catalog;products=data.products;home();
  }catch(error){notice(error);$('#workspace').textContent='No se pudo cargar el control de eventos. Pulsa Actualizar para reintentar.';}
}
function home(){
  current=null;
  $('#workspace').innerHTML=`<h1>Tu mesa de ventas</h1><p>Elige un evento para registrar ventas y regalos. Moneda: pesos dominicanos (RD$).</p><div class="panel">${events.length?events.map(e=>`<p><button data-event="${esc(e.id)}">${esc(e.name)} · ${esc(e.date)} ${e.closed?'· Cerrado':''}</button></p>`).join(''):'Todavía no hay eventos.'}</div>${user.role==='admin'?`<details><summary>Preparar un nuevo evento</summary><form id="prepare"><div class="fields"><label>Nombre del evento<input name="name" required maxlength="120"></label><label>Fecha<input name="date" type="date" required></label><label>Efectivo inicial para cambio (RD$)<input name="cash" type="number" min="0" max="1000000" step="0.01" value="0" required></label></div><p>Introduce las unidades que llevarás y el precio de cada obra o volumen. Deja en 0 lo que no llevarás. Precio 0 permite solo regalos.</p><div class="inventory"><strong>Obra</strong><strong>Unidades</strong><strong>Precio RD$</strong></div>${catalog.map((c,index)=>`<div class="inventory" data-index="${index}"><span>${esc(c.title)}</span><input aria-label="Unidades de ${esc(c.title)}" type="number" min="0" max="100000000" step="1" value="0" data-stock required><input aria-label="Precio de ${esc(c.title)}" type="number" min="0" max="1000000" step="0.01" value="${(c.price||0)/100}" data-price required></div>`).join('')}<p><button class="primary">Crear evento y guardar inventario</button></p></form></details>`:''}`;
  $('#workspace').insertAdjacentHTML('beforeend',productMarkup());
  bindProducts();
  if(location.hash==='#productos')$('#productos').scrollIntoView();
  document.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>load(b.dataset.event).catch(notice));
  if($('#prepare'))$('#prepare').onsubmit=async event=>{
    event.preventDefault();const form=event.currentTarget;const button=form.querySelector('button');button.disabled=true;
    try{const input=new FormData(form);const items=[...form.querySelectorAll('[data-index]')].map(row=>({id:catalog[Number(row.dataset.index)].id,brought:Number(row.querySelector('[data-stock]').value),price:Math.round(Number(row.querySelector('[data-price]').value)*100)})).filter(i=>i.brought>0);
      const result=await api('/events',{name:input.get('name'),date:input.get('date'),openingCash:Math.round(Number(input.get('cash'))*100),items});await load(result.id);
    }catch(error){notice(error);button.disabled=false;}
  };
}
async function load(id){current=await api(`/event?id=${encodeURIComponent(id)}`);render();}
function render(){
  const {event,items,movements,totals:t}=current;
  $('#workspace').innerHTML=`<div class="toolbar"><button id="back">← Eventos</button><h1>${esc(event.name)}</h1><span>${esc(event.date)} · ${event.closed?'Cerrado':'En curso'}</span></div><div class="summary">${[['Caja en efectivo',money(t.drawer)],['Ventas en efectivo',money(t.cash)],['Transferencias',money(t.transfer)],['Tarjetas',money(t.card)],['Total vendido',money(t.revenue)],['Unidades llevadas',t.brought],['Vendidas / regaladas',`${t.sold} / ${t.gift}`],['Unidades restantes',t.remaining]].map(([label,value])=>`<article>${label}<b>${value}</b></article>`).join('')}</div><p>Caja = ${money(event.opening_cash)} de cambio inicial + ventas en efectivo. Requiere conexión para guardar.</p><div class="toolbar"><input id="search" type="search" placeholder="Buscar obra o volumen" aria-label="Buscar obra"><label><input id="available" type="checkbox"> Solo disponibles</label></div><p>Toca una portada y elige el pago o regalo.</p><div id="covers" class="grid"></div><details class="panel"><summary>Inventario e historial · ${movements.length} movimientos</summary><div>${items.map(i=>`<p><strong>${esc(i.title)}</strong> · Llevadas: ${i.brought} · Restantes: ${i.remaining} · Vendidas: ${movements.filter(m=>!m.voided&&m.item_id===i.id&&m.method!=='gift').length} · Regalos: ${movements.filter(m=>!m.voided&&m.item_id===i.id&&m.method==='gift').length}</p>`).join('')}</div><h2>Movimientos</h2>${movements.map(m=>`<div class="movement"><span>${esc(items.find(i=>i.id===m.item_id)?.title)} · ${names[m.method]} · ${money(m.amount)} ${m.voided?'· ANULADO':''}<small>${esc(m.created_at)} UTC · ${esc(m.actor)}</small></span>${user.role==='admin'&&!event.closed&&!m.voided?`<button data-void="${esc(m.id)}">Anular</button>`:''}</div>`).join('')||'<p>No hay movimientos.</p>'}</details>${user.role==='admin'&&!event.closed?'<button id="close">Cerrar evento</button>':''}`;
  $('#back').onclick=start;$('#search').oninput=covers;$('#available').onchange=covers;covers();
  document.querySelectorAll('[data-void]').forEach(b=>b.onclick=async()=>{if(!confirm('¿Anular este movimiento y devolver una unidad al inventario?'))return;b.disabled=true;try{await api('/void',{id:b.dataset.void,eventId:event.id});await load(event.id);}catch(error){notice(error);b.disabled=false;}});
  if($('#close'))$('#close').onclick=async()=>{if(!confirm('¿Cerrar el evento? Ya no podrás registrar ni anular ventas.'))return;$('#close').disabled=true;try{await api('/close',{eventId:event.id});await load(event.id);}catch(error){notice(error);$('#close').disabled=false;}};
}
function covers(){
  const query=$('#search').value.toLocaleLowerCase('es');const items=current.items.filter(i=>i.title.toLocaleLowerCase('es').includes(query)&&(!$('#available').checked||i.remaining>0));
  $('#covers').innerHTML=items.map(i=>`<button class="comic" data-item="${esc(i.id)}" ${current.event.closed||!i.remaining?'disabled':''}><img src="${esc(i.cover||'/sales-product-placeholder.svg')}" alt="Imagen de ${esc(i.title)}" loading="lazy"><strong>${esc(i.title)}</strong><span>${money(i.price)}</span><small>${i.remaining?`${i.remaining} disponibles`:'Agotado'}</small></button>`).join('')||'<p>No hay obras con ese filtro.</p>';
  fallbackImages($('#covers'));
  document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{selected=current.items.find(i=>i.id===b.dataset.item);pending=null;$('#sale-title').textContent=selected.title;$('#sale-price').textContent=money(selected.price);$('#sale-message').textContent='';document.querySelectorAll('[data-method]').forEach(p=>p.disabled=p.dataset.method!=='gift'&&!selected.price);$('#sale').showModal();});
}
document.querySelectorAll('[data-method]').forEach(button=>button.onclick=async()=>{
  if(busy)return;busy=true;document.querySelectorAll('[data-method]').forEach(b=>b.disabled=true);$('#sale .cancel').disabled=true;
  pending ||= {id:crypto.randomUUID(),eventId:current.event.id,itemId:selected.id,method:button.dataset.method};
  try{await api('/movement',pending);$('#sale').close();notice('Movimiento guardado.');await load(current.event.id);}
  catch(error){$('#sale-message').textContent=`${error.message} Puedes reintentar el mismo registro.`;document.querySelectorAll('[data-method]').forEach(b=>b.disabled=b.dataset.method!==pending.method);}
  finally{busy=false;$('#sale .cancel').disabled=false;}
});
$('#sale').addEventListener('cancel',event=>{if(busy)event.preventDefault();});
$('#refresh').onclick=()=>{if(busy)return;(current?load(current.event.id):start()).catch(notice);};
start();
