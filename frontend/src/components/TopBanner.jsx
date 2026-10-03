import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
const whatsapp = import.meta.env.VITE_WHATSAPP_URL || 'https://wa.me/2348033560449';
export default function TopBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return <div className="top-banner"><span>For more enquiries and information you can reach us on <a href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15}/> WhatsApp</a></span><button aria-label="Dismiss WhatsApp banner" onClick={() => setVisible(false)}><X size={16}/></button></div>;
}
