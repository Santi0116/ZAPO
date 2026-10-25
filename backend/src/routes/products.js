const express = require("express");
const { adminClient } = require("../config/supabase");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await adminClient.from("products")
      .select("id,name,description,category,price,image_url,active,product_variants(id,size,color,stock)")
      .eq("active", true).order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { data, error } = await adminClient.from("products")
      .select("id,name,description,category,price,image_url,active,product_variants(id,size,color,stock)")
      .eq("id", req.params.id).eq("active", true).single();
    if (error) return res.status(404).json({ error: "Producto no encontrado." });
    res.json(data);
  } catch (e) { next(e); }
});

module.exports = router;
