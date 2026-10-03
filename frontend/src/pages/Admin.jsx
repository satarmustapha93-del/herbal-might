import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const empty = { name:'', slug:'', description:'', benefits:'', how_to_use:'', category:'roots', price:'', stock:'', image_url:'', is_featured:false };
const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
export default function Admin() {
  const { user, isAdmin, loading, configured } = useAuth();
  const [products,setProducts]=useState([]); const [orders,setOrders]=useState([]);
  const [form,setForm]=useState(empty); const [editing,setEditing]=useState(null); const [file,setFile]=useState(null);
  const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [tab,setTab]=useState('products');

  async function refresh() {
    if (!supabase) return;
    const [productResult, orderResult] = await Promise.all([
      supabase.from('products').select('*').order('created_at',{ascending:false}),
      supabase.from('orders').select('*').order('created_at',{ascending:false}),
    ]);
    if (productResult.data) setProducts(productResult.data);
    if (orderResult.data) setOrders(orderResult.data);
    if (productResult.error) setMessage(productResult.error.message);
  }
  useEffect(()=>{if(isAdmin)refresh()},[isAdmin]);

  if(loading) return <div className="container page-wrap loading-row">Checking your access…</div>;
  if(!configured) return <div className="container page-wrap"><div className="notice-box">Add Supabase credentials to enable the admin area.</div></div>;
  if(!user||!isAdmin) return <div className="container page-wrap"><div className="page-heading"><span className="eyebrow">PRIVATE AREA</span><h1>Admin <i>studio.</i></h1><p>{user?'This account does not have admin access. Promote it in Supabase profiles.':'Please sign in with your admin account.'}</p></div></div>;

  function edit(product){setEditing(product.id);setForm({...empty,...product,price:String(product.price),stock:String(product.stock)});setFile(null);window.scrollTo({top:0,behavior:'smooth'});}
  async function save(event){
    event.preventDefault();setBusy(true);setMessage('');
    try{
      let imageUrl=form.image_url;
      if(file){
        const extension=file.name.split('.').pop().toLowerCase();
        const path=`${crypto.randomUUID()}.${extension}`;
        const {error:uploadError}=await supabase.storage.from('product-images').upload(path,file,{upsert:false,contentType:file.type});
        if(uploadError)throw uploadError;
        imageUrl=supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
      }
      const slug=(form.slug||form.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      const payload={name:form.name.trim(),slug,description:form.description,benefits:form.benefits,how_to_use:form.how_to_use,category:form.category,price:Number(form.price),stock:Number(form.stock),image_url:imageUrl,is_featured:Boolean(form.is_featured)};
      const result=editing?await supabase.from('products').update(payload).eq('id',editing).select().single():await supabase.from('products').insert(payload).select().single();
      if(result.error)throw result.error;
      setMessage(editing?'Product updated.':'Product added.');setForm(empty);setFile(null);setEditing(null);await refresh();
    }catch(err){setMessage(err.message||'Could not save product.');}
    finally{setBusy(false);}
  }
  async function remove(product){
    if(!window.confirm(`Remove ${product.name} from the shop?`))return;
    const {error}=await supabase.from('products').delete().eq('id',product.id);
    if(error)setMessage(error.message);else{setProducts(old=>old.filter(item=>item.id!==product.id));setMessage(`${product.name} removed.`);}
  }
  async function updateOrderStatus(id,status){
    const {error}=await supabase.from('orders').update({status}).eq('id',id);
    if(error)setMessage(error.message);else setOrders(old=>old.map(order=>order.id===id?{...order,status}:order));
  }

  return <div className="container page-wrap admin-page">
    <div className="page-heading"><span className="eyebrow">HERBAL MIGHT · BACK OFFICE</span><h1>Admin <i>studio.</i></h1><p>Manage the apothecary and customer orders.</p></div>
    <div className="admin-tabs"><button className={tab==='products'?'selected':''} onClick={()=>setTab('products')}>Products ({products.length})</button><button className={tab==='orders'?'selected':''} onClick={()=>setTab('orders')}>Orders ({orders.length})</button></div>
    {message&&<div className="notice-box">{message}</div>}
    {tab==='products'?<div className="admin-layout">
      <form className="form-panel admin-form" onSubmit={save}>
        <h2>{editing?'Edit botanical':'Add a botanical'}</h2>
        <div className="form-grid">
          <label>Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>URL slug<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="created-from-name"/></label>
          <label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="roots">Roots</option><option value="leaves">Leaves</option><option value="powders">Powders</option><option value="mixtures">Mixtures</option></select></label>
          <label>Price (₦)<input type="number" min="0" step="100" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
          <label>Stock<input type="number" min="0" required value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label>
          <label className="span-two">Product image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/><small>JPG, PNG or WebP. Uploaded to product-images.</small></label>
          <label className="span-two">Or image URL<input value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://…"/></label>
          <label className="span-two">Description<textarea required rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
          <label className="span-two">Benefits<textarea rows="2" value={form.benefits} onChange={e=>setForm({...form,benefits:e.target.value})}/></label>
          <label className="span-two">How to use<textarea rows="2" value={form.how_to_use} onChange={e=>setForm({...form,how_to_use:e.target.value})}/></label>
          <label className="checkbox-field"><input type="checkbox" checked={form.is_featured} onChange={e=>setForm({...form,is_featured:e.target.checked})}/> Feature on home page</label>
        </div>
        <div className="admin-form-actions"><button className="button button-dark" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Add product'}<Plus size={15}/></button>{editing&&<button type="button" className="button button-outline" onClick={()=>{setEditing(null);setForm(empty);setFile(null)}}>Cancel</button>}</div>
      </form>
      <section className="admin-list"><div className="section-head"><h2>Product catalogue</h2></div>{products.map(product=><article className="admin-product-row" key={product.id}><img src={product.image_url} alt=""/><div><strong>{product.name}</strong><small>{naira(product.price)} · {product.stock} in stock</small></div><button aria-label={`Edit ${product.name}`} onClick={()=>edit(product)}><Pencil size={16}/></button><button className="danger-button" aria-label={`Remove ${product.name}`} onClick={()=>remove(product)}><Trash2 size={16}/></button></article>)}</section>
    </div>:<section className="orders-panel"><h2>All orders</h2>{orders.length?orders.map(order=><article key={order.id} className="admin-order-card"><div><strong>{order.customer_name}</strong><small>{order.customer_email} · {order.customer_phone}</small><small>{order.address}</small></div><div className="order-items-text">{(order.items||[]).map(item=><span key={item.product_id}>{item.name} × {item.quantity}</span>)}</div><strong>{naira(order.total_amount)}</strong><select aria-label="Order status" value={order.status} onChange={e=>updateOrderStatus(order.id,e.target.value)}><option>pending</option><option>confirmed</option><option>processing</option><option>shipped</option><option>delivered</option><option>cancelled</option></select></article>):<p className="muted">There are no orders yet.</p>}</section>}
  </div>;
}
