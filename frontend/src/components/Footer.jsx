import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
const socials = [
  ['TikTok', import.meta.env.VITE_TIKTOK_URL || 'https://www.tiktok.com/@drherbalmighty', '♪'],
  ['Facebook', import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/share/19syV9jCJQ/?mibextid=wwXIfr', 'f'],
  ['WhatsApp', import.meta.env.VITE_WHATSAPP_URL || 'https://wa.me/2348033560449', '◉'],
];
export default function Footer() {
  return <footer className="footer"><div className="container footer-grid">
    <div><Link to="/" className="wordmark"><span className="logo-icon"><Leaf/></span><span>Herbal Might<small>BOTANICALS · ROOTED IN CARE</small></span></Link><p className="footer-intro">Nature, thoughtfully gathered.<br/>Goodness for your everyday rituals.</p><div className="social-links">{socials.map(([name,url,icon])=><a key={name} href={url} target="_blank" rel="noreferrer" aria-label={`${name} — Herbal Might`}><span>{icon}</span>{name}</a>)}</div></div>
    <div><h4>Discover</h4><Link to="/shop">Shop botanicals</Link><Link to="/about">Our story</Link><Link to="/contact">Contact us</Link></div>
    <div><h4>Here to help</h4><Link to="/login">Your account</Link><Link to="/cart">Shopping cart</Link><a href={socials[2][1]} target="_blank" rel="noreferrer">WhatsApp enquiries</a></div>
    <div className="footer-signoff">Rooted in nature.<br/><i>Prepared with care.</i></div>
  </div><div className="container footer-legal"><span>© {new Date().getFullYear()} Herbal Might</span><span>Natural botanicals · Lagos, Nigeria</span></div></footer>;
}
