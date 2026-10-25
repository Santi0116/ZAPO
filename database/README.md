# Supabase
Ejecuta `schema.sql` y después `seed.sql` en SQL Editor. RLS está habilitado en las tablas principales. La aplicación usa Supabase Auth para identificar clientes; el backend verifica el JWT antes de ejecutar operaciones privadas.

Para crear un administrador:
1. Registra una cuenta normal en la aplicación.
2. Copia el UUID del usuario desde Authentication > Users.
3. Desde SQL Editor ejecuta `update public.profiles set role = 'admin' where id = 'UUID_REAL';`
No uses este procedimiento desde el frontend ni expongas la clave de servicio.
