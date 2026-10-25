insert into public.products(name,description,category,price,image_url,active) values
('Camiseta Essential','Camiseta básica de algodón para uso diario.','Camisetas',39900,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',true),
('Hoodie Urban','Buzo cómodo de estilo urbano.','Chaquetas',119900,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',true),
('Pantalón Classic','Pantalón versátil para combinar con tu estilo.','Pantalones',89900,'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',true)
on conflict do nothing;

insert into public.product_variants(product_id,size,color,stock)
select p.id, v.size, v.color, 10
from public.products p
cross join (values ('S','Negro'),('M','Negro'),('L','Negro'),('M','Blanco')) as v(size,color)
where p.name in ('Camiseta Essential','Hoodie Urban','Pantalón Classic')
on conflict (product_id,size,color) do nothing;
