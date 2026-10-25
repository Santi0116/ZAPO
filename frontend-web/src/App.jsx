import { Routes,Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import StoreLocation from "./pages/StoreLocation";
import AdminDashboard from "./pages/AdminDashboard";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";


export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/cuenta" element={<Account />} />
          <Route path="/pedidos" element={<Orders />} />
          <Route path="/tienda" element={<StoreLocation />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/repartidor" element={<DeliveryDashboard />} />

          <Route
            path="*"
            element={
              <main className="section page-content">
                <h1>Página no encontrada</h1>
                <a href="/">Volver al inicio</a>
              </main>
            }
          />
        </Routes>

        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}
