
import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import ProductCard from "../components/ProductCard";

const money = (value) =>
  Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const data = await apiRequest("/api/products");

        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || "No se pudieron cargar los productos.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => [
      "Todas",
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ],
    [products]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "Todas" || product.category === category;

      const matchesQuery = [
        product.name,
        product.description,
        product.category,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedQuery)
        );

      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  if (loading) {
    return (
      <main className="section page-content">
        <p className="eyebrow">ENCUENTRA TU ESTILO</p>
        <h1>Catálogo ZAPO</h1>
        <p>Cargando productos...</p>
      </main>
    );
  }

  return (
    <main className="section page-content">
      <p className="eyebrow">ENCUENTRA TU ESTILO</p>
      <h1>Catálogo</h1>
      <p>Explora las prendas disponibles y encuentra tu próximo estilo.</p>

      <div className="catalog-controls">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar prendas..."
          aria-label="Buscar prendas"
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filtrar por categoría"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div>
          <p className="notice error">{error}</p>
          <button
            className="button button-outline"
            type="button"
            onClick={() => window.location.reload()}
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      {!error && filtered.length > 0 && (
        <>
          <p>{filtered.length} producto(s) encontrado(s).</p>
          <div className="product-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}

      {!error && filtered.length === 0 && (
        <p>
          {products.length === 0
            ? "Todavía no hay productos activos en el catálogo."
            : "No encontramos productos con esos filtros."}
        </p>
      )}
    </main>
  );
}
