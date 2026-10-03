import { Link, NavLink } from 'react-router-dom';
import { Leaf, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
export default function Navbar() {
  const { count } = useCart(); const { user, signOut, isAdmin } = useAuth(); const [open, setOpen] = useState(false);
  return <header className="navbar"><div className="container nav-inner">
    <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X/> : <Menu/>}</button>
    <Link to="/" className="wordmark"><span className="logo-icon"><Leaf size={21}/></span><span>Herbal Might<small>BOTANICALS · ROOTED IN CARE</small></span></Link>
    <nav className={open ? 'nav-links open' : 'nav-links'}><NavLink to="/">Home</NavLink><NavLink to="/shop">Shop</NavLink><NavLink to="/about">About</NavLink><NavLink to="/contact">Contact</NavLink></nav>
    <div className="nav-actions">{user ? <div className="profile-menu"><Link to={isAdmin ? '/admin' : '/login'} className="profile-link"><UserRound size={18}/><span>{user.email?.split('@')[0]}</span></Link><button className="text-button" onClick={signOut}>Sign out</button></div> : <Link className="profile-link" to="/login"><UserRound size={19}/><span>Sign in</span></Link>}<Link to="/cart" className="cart-link" aria-label={`Cart, ${count} items`}><ShoppingBag size={20}/><span>Cart</span><b>{count}</b></Link></div>
  </div></header>;
}
