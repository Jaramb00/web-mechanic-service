-- Minimalni šifrarnici koje testovi trebaju.
-- Namjerno BEZ korisnika, vozila i termina — svaki test kreira svoje podatke,
-- pa testovi ne ovise jedan o drugome ni o redoslijedu izvođenja.

INSERT INTO services (name, description, price, duration_minutes, sort_order) VALUES
    ('Test usluga 30',  'Traje 30 minuta.', 20.00, 30, 10),
    ('Test usluga 60',  'Traje 60 minuta.', 50.00, 60, 20),
    ('Test neaktivna',  'Neaktivna usluga.', 10.00, 30, 30);
UPDATE services SET active = FALSE WHERE name = 'Test neaktivna';

INSERT INTO service_bays (name) VALUES ('Test mjesto 1'), ('Test mjesto 2');

INSERT INTO working_hours (day_of_week, open_time, close_time, closed) VALUES
    (1, TIME '08:00', TIME '17:00', FALSE),
    (2, TIME '08:00', TIME '17:00', FALSE),
    (3, TIME '08:00', TIME '17:00', FALSE),
    (4, TIME '08:00', TIME '17:00', FALSE),
    (5, TIME '08:00', TIME '17:00', FALSE),
    (6, TIME '08:00', TIME '13:00', FALSE),
    (7, NULL, NULL, TRUE);

INSERT INTO products (sku, name, category_id, sale_price, physical_quantity, reserved_quantity, min_quantity)
SELECT 'TEST-LIMITED', 'Test artikl s malom zalihom', c.id, 100.00, 0, 0, 2
FROM product_categories c WHERE c.code = 'TIRES';

INSERT INTO products (sku, name, category_id, sale_price, physical_quantity, reserved_quantity, min_quantity)
SELECT 'TEST-PLENTY', 'Test artikl s velikom zalihom', c.id, 50.00, 0, 0, 5
FROM product_categories c WHERE c.code = 'CONSUMABLES';
