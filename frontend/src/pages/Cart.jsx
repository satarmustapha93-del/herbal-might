import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
export default function Cart() {
  const { items, setQuantity, total } = useCart();
  return <div className="container page-wrap">
    <div className="page-heading"><span className="eyebrow">YOUR SELECTION</span><h1>Your <i>cart.</i></h1><p>Adjust the quantity for each botanical before checkout.</p></div>
    {items.length ? <div className="cart-layout">
      <div className="cart-items">{items.map(item => <article className="cart-item" key={item.id}>
        <img src={item.image_url} alt={item.name}/>
        <div className="cart-item-name"><h3>{item.name}</h3><span>{item.category}</span><button className="remove-button" onClick={()=>setQuantity(item.id,0)}><Trash2 size={14}/> Remove</button></div>
        <div className="quantity-stepper"><button aria-label={`Decrease ${item.name} quantity`} onClick={()=>setQuantity(item.id,item.quantity-1)}><Minus size={14}/></button><span>{item.quantity}</span><button aria-label={`Increase ${item.name} quantity`} disabled={item.quantity>=item.stock} onClick={()=>setQuantity(item.id,Math.min(item.stock,item.quantity+1))}><Plus size={14}/></button></div>
        <strong>{naira(item.price*item.quantity)}</strong>
      </article>)}<Link to="/shop" className="under-link continue-link">Continue browsing</Link></div>
      <aside className="summary-card"><h2>Order summary</h2>{items.map(item=><div className="summary-row" key={item.id}><span>{item.name} × {item.quantity}</span><span>{naira(item.price*item.quantity)}</span></div>)}<div className="summary-row"><span>Delivery</span><span>Confirmed after order</span></div><div className="summary-total"><span>Total</span><strong>{naira(total)}</strong></div><p>Delivery fee will be confirmed with you on WhatsApp.</p><Link className="button button-dark full" to="/checkout">Continue to checkout <ArrowRight size={16}/></Link><span className="secure-note"><ShoppingBag size={14}/> Packed thoughtfully, delivered with care</span></aside>
    </div> : <div className="empty-state"><ShoppingBag size={32}/><h2>Your cart is waiting.</h2><p>Explore the apothecary and find something lovely.</p><Link className="button button-dark" to="/shop">Shop botanicals <ArrowRight size={16}/></Link></div>}
  </div>;
}
