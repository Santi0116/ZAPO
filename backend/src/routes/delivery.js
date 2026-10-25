
const express = require("express");
const { adminClient } = require("../config/supabase");
const {
  requireAuth,
  allowRoles,
} = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, allowRoles("delivery"));

router.get("/orders", async (req, res, next) => {
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
      .eq("delivery_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    next(error);
  }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body || {};

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        error: "El identificador del pedido no es válido.",
      });
    }

    if (!["on_the_way", "delivered"].includes(status)) {
      return res.status(400).json({
        error: "Estado no permitido.",
      });
    }

    // Consultar exclusivamente un pedido asignado al repartidor.
    const { data: order, error: findError } = await adminClient
      .from("orders")
      .select("id,status,delivery_id")
      .eq("id", orderId)
      .eq("delivery_id", req.user.id)
      .maybeSingle();

    if (findError) throw findError;

    if (!order) {
      return res.status(404).json({
        error: "Pedido no asignado a este repartidor.",
      });
    }

    // Transiciones permitidas para evitar saltarse etapas.
    const canChange =
      status === "on_the_way"
        ? ["confirmed", "preparing", "on_the_way"].includes(order.status)
        : order.status === "on_the_way";

    if (!canChange) {
      return res.status(409).json({
        error:
          status === "delivered"
            ? "El pedido debe estar en camino antes de marcarlo como entregado."
            : "El estado actual no permite iniciar la entrega.",
      });
    }

    const { data: updated, error: updateError } = await adminClient
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .eq("delivery_id", req.user.id)
      .eq("status", order.status)
      .select("id,status,total,delivery_address,created_at")
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updated) {
      return res.status(409).json({
        error:
          "El pedido cambió mientras lo actualizabas. Recarga la lista e inténtalo de nuevo.",
      });
    }

    const { error: historyError } = await adminClient
      .from("order_status_history")
      .insert({
        order_id: updated.id,
        status: updated.status,
        changed_by: req.user.id,
      });

    if (historyError) {
      // El estado ya se actualizó. No ocultar que falló el historial.
      console.error(
        "El pedido se actualizó, pero falló el historial:",
        historyError.message
      );

      return res.status(500).json({
        error:
          "El estado cambió, pero no se pudo registrar el historial. Contacta al administrador antes de volver a actualizarlo.",
        order: updated,
      });
    }

    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
