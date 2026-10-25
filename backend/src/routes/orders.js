
const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { adminClient } = require("../config/supabase");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Consultar únicamente los pedidos del usuario autenticado.
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await adminClient
      .from("orders")
      .select(`
        id,
        status,
        total,
        delivery_address,
        created_at,
        order_items (
          id,
          quantity,
          unit_price,
          product_variants (
            size,
            color,
            products (name)
          )
        )
      `)
      .eq("customer_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

// Crear pedido.
// La función SQL debe calcular los precios y descontar el inventario
// de forma transaccional.
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { address, items } = req.body || {};

    if (typeof address !== "string" || !address.trim()) {
      return res.status(400).json({
        error: "Ingresa una dirección de entrega válida.",
      });
    }

    if (address.trim().length > 250) {
      return res.status(400).json({
        error: "La dirección no puede superar los 250 caracteres.",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Agrega al menos un producto.",
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        error: "El pedido supera el número máximo de artículos.",
      });
    }

    const cleanItems = items.map((item) => ({
      variant_id: Number(item?.variant_id),
      quantity: Number(item?.quantity),
    }));

    const invalidItems = cleanItems.some(
      (item) =>
        !Number.isSafeInteger(item.variant_id) ||
        item.variant_id <= 0 ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 50
    );

    if (invalidItems) {
      return res.status(400).json({
        error: "Los productos o las cantidades no son válidos.",
      });
    }

    // Evitar variantes repetidas en la solicitud.
    const variantIds = cleanItems.map((item) => item.variant_id);

    if (new Set(variantIds).size !== variantIds.length) {
      return res.status(400).json({
        error: "Hay variantes duplicadas en el pedido.",
      });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error(
        "Falta configurar SUPABASE_URL o SUPABASE_ANON_KEY en el backend."
      );
    }

    // Usar el token del usuario para que auth.uid() en PostgreSQL
    // corresponda al cliente que inició sesión.
    const userClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${req.accessToken}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await userClient.rpc("create_order", {
      p_address: address.trim(),
      p_items: cleanItems,
    });

    if (error) {
      console.error("Error creando pedido:", error.message);

      return res.status(400).json({
        error: "No se pudo crear el pedido. Verifica el inventario y los productos.",
      });
    }

    return res.status(201).json({
      id: data,
      message: "Pedido creado correctamente.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
