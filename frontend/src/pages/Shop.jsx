import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { demoProducts } from '../data/products';
import { supabase } from '../lib/supabase';

export default function Shop(){
 const [params,setParams]=useSearchParams(); const [products,setProducts]=useState(demoProducts); const [search,setSearch]=useState(''); const [category,setCategory]=useState(params.get('category')||'all'); const [max,setMax]=useState(50000); const [loading,setLoading]=useState(Boolean(supabase));
 useEffect(()=>{if(supabase)supabase.from('products').select('*').order('created_at',{ascending:false}).then(({data})=>{if(data)setProducts(data);setLoading(false)});else setLoading(false)},[]);
 const shown=useMemo(()=>products.filter(p=>(category==='all'||p.category===category)&&p.name.toLowerCase().includes(search.toLowerCase())&&Number(p.price)<=max),[products,category,search,max]);
 function choose(c){setCategory(c);if(c==='all')params.delete('category');else params.set('category',c);setParams(params)}
 return <div className="page-wrap container"><div className="page-heading"><span className="eyebrow">THE HERBAL COLLECTION</span><h1>Shop <i>botanicals.</i></h1><p>Natural herbs and roots, thoughtfully selected for your home.</p></div><div className="shop-controls"><label className="search-control"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search herbs, roots, leaves..."/><button aria-label="Clear search" onClick={()=>setSearch('')}><X size={15}/></button></label><label className="category-control"><SlidersHorizontal size={16}/><select value={category} onChange={e=>choose(e.target.value)}><option value="all">All categories</option><option value="roots">Roots</option><option value="leaves">Leaves</option><option value="powders">Powders</option><option value="mixtures">Mixtures</option></select></label><label className="price-control">Up to ₦{max.toLocaleString()}<input type="range" min="4000" max="50000" step="1000" value={max} onChange={e=>setMax(Number(e.target.value))}/></label></div><p className="result-count">{loading?'Gathering the collection…':`${shown.length} botanicals in the collection`}</p>{loading?<div className="loading-row">Loading the apothecary…</div>:shown.length?<div className="product-grid">{shown.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="empty-state"><h2>No botanicals found</h2><p>Try a different search or category.</p></div>}</div>;
}
