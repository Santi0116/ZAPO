import { Link } from "react-router-dom";
export default function ProductCard({ product }) {
  return <Link className="product-card" to={`/producto/${product.id}`}>
    <div className="product-image">
      {product.image_url ? <img src={product.image_url} alt={product.name} loading="lazy"/> : <div className="image-placeholder">ZAPO</div>}
      <span className="product-category">{product.category}</span>
    </div>
    <div className="product-info"><h3>{product.name}</h3><strong>{Number(product.price).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</strong></div>
  </Link>;
}
