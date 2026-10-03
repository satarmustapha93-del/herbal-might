import { Link } from 'react-router-dom';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
export default function ProductCard({ product }) {
  const { add } = useCart();
  return <article className="product-card"><Link className="product-photo" to={`/product/${product.slug}`}><img src={product.image_url} alt={product.name} loading="lazy"/><span className="photo-arrow"><ArrowUpRight size={17}/></span></Link><div className="product-card-body"><div className="product-title-row"><Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link><strong>{naira(product.price)}</strong></div><p>{product.description}</p><div className="product-bottom"><span>{product.category}</span><button onClick={() => add(product)} disabled={!product.stock}><ShoppingBag size={15}/> Add to cart</button></div></div></article>;
}
