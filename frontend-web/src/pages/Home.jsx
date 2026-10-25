import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { apiRequest("/api/products").then(setProducts).catch(e => setError(e.message)); }, []);
  return <main>
    <section className="hero">
      <div className="hero-copy"><span className="eyebrow">NUEVA TEMPORADA · ZAPO</span><h1>Viste como<br />te sientes.</h1><p>Prendas para todos los días. Encuentra tu próximo favorito.</p><Link className="button button-light" to="/catalogo">Explorar colección <ArrowRight size={18} /></Link></div>
      <div className="hero-image"><img src="https://vcdhkxcwyohbjweaqatw.supabase.co/storage/v1/object/public/CATALOGO/Logos/ZAPO-LOGOTIPO.jpeg" alt="Imagen de la hero section" className="site-logotipo" /></div>

      <span className="hero-caption">STREET<br />ESSENTIALS</span>

    </section>
    <section className="section"><div className="section-heading"><div><span className="eyebrow">SELECCIÓN ZAPO</span><h2>Prendas destacadas</h2></div><Link className="text-link" to="/catalogo">Ver catálogo <ArrowRight size={16} /></Link></div>
      {error && <p className="notice">{error} Comprueba que el backend esté ejecutándose.</p>}
      {products.length ? <div className="product-grid">{products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}</div> : !error && <p>Cargando productos…</p>}
    </section>
    <section className="benefits">
      <div classname="div-benefits">
        <Truck />
        <h3>Compra fácil</h3>
        <p>Consulta tus pedidos desde tu cuenta.</p>
      </div>
      <div classname="div-benefits">
        <ShieldCheck />
        <h3>Compra con confianza</h3>
        <p>Información clara de tus prendas.</p>
      </div>
      <div classname="div-benefits">
        <MapPin />
        <h3>Encuéntranos</h3>
        <p>Visita nuestra sucursal física.</p>
        <Link to="/tienda">Ver ubicación</Link>
      </div>
    </section>
  </main>;
}
