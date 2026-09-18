-- AURELIA starter catalog
insert into categories (slug, name, sort_order) values
('sofa','Sofy',1),
('stol','Stoły',2),
('krzeslo','Krzesła',3),
('oswietlenie','Oświetlenie',4)
on conflict (slug) do nothing;

insert into products
(sku, slug, name, short_description, category_id, price, currency, status, is_bestseller, is_new)
select 'AUR-SOF-LUNA','luna-soft','Luna Soft','Sofa / 3-osobowa',id,4290,'PLN','active',true,false
from categories where slug='sofa'
on conflict (sku) do nothing;

insert into products
(sku, slug, name, short_description, category_id, price, currency, status)
select 'AUR-STO-ENA','ena-oak','Ena Oak','Stół / dąb',id,2490,'PLN','active'
from categories where slug='stol'
on conflict (sku) do nothing;

insert into products
(sku, slug, name, short_description, category_id, price, currency, status, is_new)
select 'AUR-KRZ-MIA','mia-chair','Mia Chair','Krzesło / tkanina',id,590,'PLN','active',true
from categories where slug='krzeslo'
on conflict (sku) do nothing;

insert into products
(sku, slug, name, short_description, category_id, price, currency, status)
select 'AUR-LAM-NOVA','nova-light','Nova Light','Lampa / szkło',id,790,'PLN','active'
from categories where slug='oswietlenie'
on conflict (sku) do nothing;

insert into inventory (product_id, quantity, reorder_level)
select p.id, 10, 2 from products p
where p.sku in ('AUR-SOF-LUNA','AUR-STO-ENA','AUR-KRZ-MIA','AUR-LAM-NOVA')
and not exists (select 1 from inventory i where i.product_id=p.id);

insert into product_images (product_id, url, alt_text, is_primary, sort_order)
select p.id, x.url, x.alt_text, true, 0
from (values
 ('AUR-SOF-LUNA','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85','Sofa Luna Soft'),
 ('AUR-STO-ENA','https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=900&q=85','Stół Ena Oak'),
 ('AUR-KRZ-MIA','https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=900&q=85','Krzesło Mia Chair'),
 ('AUR-LAM-NOVA','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85','Lampa Nova Light')
) as x(sku,url,alt_text)
join products p on p.sku=x.sku
where not exists (select 1 from product_images pi where pi.product_id=p.id);
