const { publicClient, adminClient } = require("../config/supabase");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Inicia sesión para continuar." });

    const { data, error } = await publicClient.auth.getUser(token);
    if (error || !data.user) return res.status(401).json({ error: "Sesión no válida." });

    const { data: profile, error: profileError } = await adminClient
      .from("profiles").select("id,role,full_name").eq("id", data.user.id).single();
    if (profileError || !profile) return res.status(403).json({ error: "Perfil no encontrado." });

    req.user = data.user;
    req.profile = profile;
    req.accessToken = token;
    next();
  } catch (e) {
    next(e);
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.profile || !roles.includes(req.profile.role)) {
      return res.status(403).json({ error: "No tienes permisos para esta acción." });
    }
    next();
  };
}

module.exports = { requireAuth, allowRoles };
