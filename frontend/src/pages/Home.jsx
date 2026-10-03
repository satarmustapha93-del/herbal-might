import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, Leaf, ShieldCheck, Sprout, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { demoProducts } from '../data/products';
import { supabase } from '../lib/supabase';

const categories=[['roots','Roots','photo-1501004318641-b39e6451bec6'],['leaves','Leaves','photo-1448375240586-882707db888b'],['powders','Powders','photo-1547592180-85f173990554'],['mixtures','Mixtures','photo-1615485500704-8e990f9900f2']];
export default function Home(){
 const [products,setProducts]=useState(demoProducts.filter(p=>p.is_featured));
 useEffect(()=>{if(supabase)supabase.from('products').select('*').eq('is_featured',true).order('created_at',{ascending:false}).then(({data})=>{if(data?.length)setProducts(data)})},[]);
 return <>
  <section className="hero"><div className="hero-image"/><div className="container hero-copy"><span className="eyebrow"><Leaf size={14}/> BOTANICALS, ROOTED IN CARE</span><h1>Nature has a way<br/>of <i>bringing us back.</i></h1><p>Thoughtfully gathered herbs, roots and leaves for a more considered everyday.</p><Link className="button button-cream" to="/shop">Explore the collection <ArrowRight size={16}/></Link><div className="hero-caption"><span>01 / 04</span><span>GATHERED WITH INTENTION</span></div></div><div className="hero-seal"><Sprout/><span>PURE<br/>BOTANICALS</span></div></section>
  <section className="trust-strip"><div className="container trust-inner"><span><BadgeCheck/> Thoughtfully sourced</span><span><Leaf/> Plant-based goodness</span><span><ShieldCheck/> Packed with care</span><span>Made for the love of nature</span></div></section>
  <section className="section container"><div className="section-head"><div><span className="eyebrow">THE APOTHECARY SHELF</span><h2>Chosen for the <i>everyday.</i></h2></div><Link className="under-link" to="/shop">View all botanicals <ArrowRight size={15}/></Link></div><div className="product-grid">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>
  <section className="category-section"><div className="container"><div className="section-head"><div><span className="eyebrow">SHOP BY NATURE</span><h2>Find what <i>calls to you.</i></h2></div></div><div className="category-grid">{categories.map(([slug,title,img])=><Link key={slug} to={`/shop?category=${slug}`} className="category-tile" style={{backgroundImage:`linear-gradient(0deg,rgba(17,36,31,.72),transparent 70%),url(https://images.unsplash.com/${img}?auto=format&fit=crop&w=800&q=85)`}}><span>{title}</span><ArrowRight size={18}/></Link>)}</div></div></section>
  <section className="story-section container" id="story"><div className="story-photo"><img src="https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=1100&q=85" alt="Botanical leaves and herbs"/><span className="photo-caption">A slower, more thoughtful kind of good</span></div><div className="story-copy"><span className="eyebrow">A NOTE FROM NATURE</span><h2>Rooted in heritage.<br/><i>Made for today.</i></h2><p>Herbal Might brings nature’s simplest ingredients closer to home. Each botanical is selected with care, handled gently and shared with the knowledge to make it part of your own ritual.</p><p>Good things don’t need to be complicated. Just honest, natural and thoughtfully prepared.</p><Link to="/about" className="under-link">Get to know our story <ArrowRight size={15}/></Link></div></section>
  <section className="testimonial"><div className="container testimonial-inner"><span className="eyebrow">THE HERBAL MIGHT STANDARD</span><div className="stars"><Leaf size={19}/></div><blockquote>Thoughtfully sourced. Clearly described. Carefully packed.<br/>Our promise in every parcel.</blockquote><span className="reviewer">NATURE, TREATED WITH RESPECT</span></div></section>
  <section className="closing-cta container"><div><span className="eyebrow">A LITTLE MORE NATURAL</span><h2>Make room for <i>good things.</i></h2></div><Link className="button button-dark" to="/shop">Browse the shop <ArrowRight size={16}/></Link></section>
 </>;
}
