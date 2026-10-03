import { useState } from 'react';
import { ArrowRight, Check, Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { initializeCheckout } from '../lib/payment';

const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
export default function Checkout() {
  const { items, total, clear } = useCart();
  const { user, configured } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState('');
  const [notice, setNotice] = useState('');
  const nav = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (!items.length) throw new Error('Your cart is empty.');
      if (!configured) {
        const id = `DEMO-${Date.now().toString().slice(-7)}`;
        await initializeCheckout({ orderId: id, amount: total });
        setPlaced(id);
        setNotice('Demo checkout only — this order was not saved or charged. Connect Supabase to place a real order.');
        clear();
        return;
      }
      if (!user) { nav('/login'); return; }

      const address = [form.get('address'), form.get('landmark'), form.get('city'), form.get('state'), form.get('country')]
        .map((part) => String(part || '').trim()).filter(Boolean).join(', ');
      const itemsForOrder = items.map((item) => ({ product_id: item.id, quantity: item.quantity }));
      const { data, error: orderError } = await supabase.rpc('create_order', {
        p_customer_name: form.get('name'),
        p_customer_email: form.get('email'),
        p_customer_phone: form.get('phone'),
        p_address: address,
        p_items: itemsForOrder,
      });
      if (orderError) throw orderError;
      const order = typeof data === 'string' ? JSON.parse(data) : data;
      await initializeCheckout({ orderId: order.id, amount: order.total_amount });
      const { error: mailError } = await supabase.functions.invoke('send-order-confirmation', { body: { order_id: order.id } });
      if (mailError) setNotice('Your order is saved. Email confirmation could not be sent yet.');
      setPlaced(order.id);
      clear();
    } catch (err) {
      setError(err.message || 'We could not place your order. Please try again.');
    } finally { setBusy(false); }
  }

  if (placed) return <div className="container page-wrap success-page"><span className="success-mark"><Check/></span><span className="eyebrow">ORDER RECEIVED</span><h1>Thank you, <i>kindly.</i></h1><p>Your order <strong>{placed.slice(0,12).toUpperCase()}</strong> is in our care. We’ll be in touch with delivery details.</p>{notice&&<div className="notice-box">{notice}</div>}<Link to="/shop" className="button button-dark">Return to the shop <ArrowRight size={16}/></Link></div>;
  if (!items.length) return <div className="container page-wrap empty-state"><h2>Your cart is empty.</h2><Link className="button button-dark" to="/shop">Browse botanicals</Link></div>;

  return <div className="container page-wrap">
    <div className="page-heading"><span className="eyebrow">DELIVERY DETAILS</span><h1>Nearly <i>yours.</i></h1><p>Enter the address where you’d like your order delivered. Checkout is currently in mock mode; no payment will be collected.</p></div>
    <div className="checkout-layout">
      <form className="form-panel" onSubmit={submit}>
        <h2>Who should receive your order?</h2>
        {!configured&&<div className="notice-box">Demo mode: preview checkout with sample products. Orders are not saved.</div>}
        {configured&&!user&&<div className="notice-box">Please <Link to="/login">sign in</Link> before placing an order.</div>}
        <div className="form-grid">
          <label>Recipient’s full name<input name="name" required autoComplete="name" defaultValue={user?.user_metadata?.full_name||''}/></label>
          <label>Email address<input name="email" type="email" required autoComplete="email" defaultValue={user?.email||''}/></label>
          <label>Phone / WhatsApp<input name="phone" type="tel" required placeholder="+234…" autoComplete="tel"/></label>
          <label className="span-two">Delivery street address<input name="address" required autoComplete="street-address" placeholder="House number, street and area"/></label>
          <label className="span-two">Landmark or delivery directions <span className="optional-label">Optional</span><input name="landmark" placeholder="Nearby landmark, gate or directions"/></label>
          <label>City / town<input name="city" required autoComplete="address-level2"/></label>
          <label>State<input name="state" required autoComplete="address-level1"/></label>
          <label className="span-two">Country<input name="country" required defaultValue="Nigeria" autoComplete="country-name"/></label>
        </div>
        <div className="payment-choice"><span className="radio-mark"/><div><strong>Herbal Might mock checkout</strong><small>Paystack / Flutterwave integration can be enabled later</small></div><span>TEST MODE</span></div>
        {error&&<p className="form-error">{error}</p>}
        <button className="button button-dark full" disabled={busy}>{busy?'Preparing your order…':`Place order · ${naira(total)}`}<ArrowRight size={16}/></button>
        <p className="fine-print">No money is charged in mock checkout. Delivery details and each item’s quantity are saved with your order.</p>
      </form>
      <aside className="summary-card"><h2>Your order · {items.length} {items.length===1?'product':'products'}</h2>{items.map(p=><div className="checkout-line" key={p.id}><img src={p.image_url} alt=""/><span>{p.name}<small>Quantity: {p.quantity}</small></span><b>{naira(p.price*p.quantity)}</b></div>)}<div className="summary-total"><span>Estimated total</span><strong>{naira(total)}</strong></div><span className="secure-note"><Leaf size={14}/> Naturally packed with care</span></aside>
    </div>
  </div>;
}
