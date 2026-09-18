-- =============================================================================
--  DEMO PODACI — aktivni samo uz `demo` profil (spring.flyway.locations).
--
--  SVI PODACI SU IZMIŠLJENI I SLUŽE ISKLJUČIVO ZA PREZENTACIJU.
--  Lozinka svih demo korisnika je `Demo1234!` (dokumentirano u README-u).
--  BCrypt strength 10, generiran za ovu demo svrhu — nikad ne koristiti
--  ovu lozinku ni hash izvan demoa.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Korisnici i uloge
-- -----------------------------------------------------------------------------
INSERT INTO users (email, password_hash, full_name, phone) VALUES
    ('admin@demo.local',     '$2a$10$0/.jhBpR21f5pcCiUKHbhOEQAi36CTIS8tKM/0EVashDlOwoVdKuK', 'Demo Administrator', '+385 91 000 0001'),
    ('majstor@demo.local',   '$2a$10$0/.jhBpR21f5pcCiUKHbhOEQAi36CTIS8tKM/0EVashDlOwoVdKuK', 'Demo Majstor',       '+385 91 000 0002'),
    ('skladiste@demo.local', '$2a$10$0/.jhBpR21f5pcCiUKHbhOEQAi36CTIS8tKM/0EVashDlOwoVdKuK', 'Demo Skladištar',    '+385 91 000 0003'),
    ('ivan@demo.local',      '$2a$10$0/.jhBpR21f5pcCiUKHbhOEQAi36CTIS8tKM/0EVashDlOwoVdKuK', 'Ivan Demić',         '+385 91 000 0011'),
    ('ana@demo.local',       '$2a$10$0/.jhBpR21f5pcCiUKHbhOEQAi36CTIS8tKM/0EVashDlOwoVdKuK', 'Ana Demić',          '+385 91 000 0012'),
    ('marko@demo.local',     '$2a$10$0/.jhBpR21f5pcCiUKHbhOEQAi36CTIS8tKM/0EVashDlOwoVdKuK', 'Marko Demić',        '+385 91 000 0013'),
    ('petra@demo.local',     '$2a$10$0/.jhBpR21f5pcCiUKHbhOEQAi36CTIS8tKM/0EVashDlOwoVdKuK', 'Petra Demić',        '+385 91 000 0014'),
    ('tomislav@demo.local',  '$2a$10$0/.jhBpR21f5pcCiUKHbhOEQAi36CTIS8tKM/0EVashDlOwoVdKuK', 'Tomislav Demić',     '+385 91 000 0015');

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM (VALUES
    ('admin@demo.local',     'ADMIN'),
    ('majstor@demo.local',   'EMPLOYEE'),
    ('skladiste@demo.local', 'WAREHOUSE_WORKER'),
    ('ivan@demo.local',      'CUSTOMER'),
    ('ana@demo.local',       'CUSTOMER'),
    ('marko@demo.local',     'CUSTOMER'),
    ('petra@demo.local',     'CUSTOMER'),
    ('tomislav@demo.local',  'CUSTOMER')
) AS v (email, role_name)
JOIN users u ON u.email = v.email
JOIN roles r ON r.name = v.role_name;

-- -----------------------------------------------------------------------------
-- Vozila
-- -----------------------------------------------------------------------------
INSERT INTO vehicles (user_id, make, model, model_year, registration, tire_size)
SELECT u.id, v.make, v.model, v.model_year, v.registration, v.tire_size
FROM (VALUES
    ('ivan@demo.local',  'Volkswagen', 'Golf VII',  2016, 'ZG1234AB', '205/55 R16'),
    ('ivan@demo.local',  'Škoda',      'Octavia',   2019, 'ZG5678CD', '225/45 R17'),
    ('ana@demo.local',   'Opel',       'Astra',     2014, 'ST2233EF', '195/65 R15'),
    ('ana@demo.local',   'Renault',    'Clio',      2021, 'ST4455GH', '185/65 R15'),
    ('marko@demo.local', 'BMW',        'Serija 3',  2018, 'RI6677IJ', '225/50 R17'),
    ('marko@demo.local', 'Ford',       'Focus',     2017, 'RI8899OP', '205/55 R16'),
    ('petra@demo.local',  'Peugeot',   '208',       2020, 'OS1122KL', '195/65 R15'),
    ('petra@demo.local',  'Citroën',   'C3',        2015, 'OS7788QR', '185/65 R15'),
    ('tomislav@demo.local','Toyota',   'Corolla',   2019, 'ZD3344MN', '205/55 R16')
) AS v (email, make, model, model_year, registration, tire_size)
JOIN users u ON u.email = v.email;

-- -----------------------------------------------------------------------------
-- Usluge i cjenik  (TODO: klijent potvrđuje stvarne cijene)
-- -----------------------------------------------------------------------------
INSERT INTO services (name, description, price, duration_minutes, sort_order) VALUES
    ('Zamjena sezonskih guma',  'Demontaža, montaža i balansiranje kompleta od 4 gume.',              60.00, 60, 10),
    ('Montaža i demontaža',     'Skidanje gume s naplatka i postavljanje nove, po kotaču.',           10.00, 30, 20),
    ('Balansiranje kotača',     'Strojno balansiranje, po kotaču.',                                    6.00, 30, 30),
    ('Popravak gume',           'Popravak probušene gume vulkanizacijom iznutra.',                    18.00, 45, 40),
    ('Krpanje gume',            'Brzo krpanje manjeg proboja na gaznom sloju.',                       12.00, 30, 50),
    ('Hotel za gume (sezona)',  'Čuvanje kompleta guma kroz jednu sezonu, uključuje pranje.',         45.00, 30, 60),
    ('Kontrola tlaka i ventila','Provjera tlaka u svim kotačima i zamjena ventila po potrebi.',        8.00, 30, 70),
    ('Popravak naplatka',       'Ravnanje lakše deformiranog aluminijskog naplatka.',                 40.00, 60, 80);

-- -----------------------------------------------------------------------------
-- Radna mjesta i radno vrijeme  (TODO: klijent potvrđuje)
-- -----------------------------------------------------------------------------
INSERT INTO service_bays (name) VALUES ('Radno mjesto 1'), ('Radno mjesto 2'), ('Radno mjesto 3');

INSERT INTO working_hours (day_of_week, open_time, close_time, closed) VALUES
    (1, TIME '08:00', TIME '17:00', FALSE),
    (2, TIME '08:00', TIME '17:00', FALSE),
    (3, TIME '08:00', TIME '17:00', FALSE),
    (4, TIME '08:00', TIME '17:00', FALSE),
    (5, TIME '08:00', TIME '17:00', FALSE),
    (6, TIME '08:00', TIME '13:00', FALSE),
    (7, NULL,         NULL,         TRUE);

-- -----------------------------------------------------------------------------
-- Artikli
-- -----------------------------------------------------------------------------
INSERT INTO products (sku, name, manufacturer, category_id, description, tire_size, sale_price, purchase_price, min_quantity)
SELECT p.sku, p.name, p.manufacturer, c.id, p.description, p.tire_size, p.sale_price, p.purchase_price, p.min_quantity
FROM (VALUES
    ('TIR-195-65-15-MI', 'Zimska guma 195/65 R15',        'Michelin',  'TIRES',       'Zimska guma za kompaktne automobile.',      '195/65 R15',  78.00, 55.00,  8),
    ('TIR-205-55-16-MI', 'Zimska guma 205/55 R16',        'Michelin',  'TIRES',       'Najprodavanija zimska dimenzija.',          '205/55 R16',  92.00, 66.00, 12),
    ('TIR-205-55-16-CO', 'Ljetna guma 205/55 R16',        'Continental','TIRES',      'Ljetna guma, niska buka.',                  '205/55 R16',  88.00, 63.00, 12),
    ('TIR-225-45-17-CO', 'Ljetna guma 225/45 R17',        'Continental','TIRES',      'Sportski profil za srednju klasu.',         '225/45 R17', 118.00, 85.00,  8),
    ('TIR-225-50-17-BR', 'Cjelogodišnja guma 225/50 R17', 'Bridgestone','TIRES',      'Cjelogodišnja guma s M+S oznakom.',         '225/50 R17', 126.00, 92.00,  6),
    ('TIR-185-65-15-GY', 'Ljetna guma 185/65 R15',        'Goodyear',  'TIRES',       'Ekonomična ljetna guma.',                   '185/65 R15',  72.00, 51.00, 10),
    ('TIR-235-40-18-PI', 'Ljetna guma 235/40 R18',        'Pirelli',   'TIRES',       'Visoke performanse.',                       '235/40 R18', 155.00, 112.00, 4),
    ('TIR-175-70-14-SA', 'Zimska guma 175/70 R14',        'Sava',      'TIRES',       'Budget zimska guma.',                       '175/70 R14',  58.00, 40.00, 10),
    ('VEN-STD-01',       'Gumeni ventil TR414',           'Generic',   'VALVES',      'Standardni gumeni ventil za čelične felge.', NULL,           1.50,  0.60, 100),
    ('VEN-ALU-02',       'Metalni ventil za alu felge',   'Generic',   'VALVES',      'Metalni ventil s brtvom.',                   NULL,           4.50,  2.10,  40),
    ('VEN-TPMS-03',      'TPMS senzor ventila',           'Schrader',  'VALVES',      'Senzor tlaka, univerzalni.',                 NULL,          42.00, 28.00,  10),
    ('DIO-VIJ-M12',      'Vijak kotača M12x1.5',          'Generic',   'CAR_PARTS',   'Vijak s konusnom glavom.',                   NULL,           2.20,  0.90, 100),
    ('DIO-MAT-M14',      'Matica kotača M14x1.5',         'Generic',   'CAR_PARTS',   'Matica s podloškom.',                        NULL,           2.60,  1.10,  80),
    ('DIO-CEN-571',      'Centrirni prsten 57.1/67.1',    'Generic',   'CAR_PARTS',   'Plastični centrirni prsten.',                NULL,           3.80,  1.40,  30),
    ('POT-UTE-KLI',      'Uteg za balansiranje (klips)',  'Generic',   'CONSUMABLES', 'Set utega za čelične felge, 100 kom.',       NULL,          14.00,  8.00,  20),
    ('POT-UTE-SAM',      'Uteg samoljepljivi',            'Generic',   'CONSUMABLES', 'Traka samoljepljivih utega.',                NULL,          16.00,  9.50,  20),
    ('POT-PAS-MON',      'Pasta za montažu guma 5kg',     'Generic',   'CONSUMABLES', 'Montažna pasta, kanta 5 kg.',                NULL,          22.00, 13.00,   5),
    ('POT-VRE-GUM',      'Vreća za čuvanje guma',         'Generic',   'CONSUMABLES', 'PE vreća za hotel guma, komad.',             NULL,           1.20,  0.45, 100)
) AS p (sku, name, manufacturer, category_code, description, tire_size, sale_price, purchase_price, min_quantity)
JOIN product_categories c ON c.code = p.category_code;

-- -----------------------------------------------------------------------------
-- Promet zalihe.
-- Količine na `products` se NE upisuju ručno — na kraju se izvedu iz knjige
-- prometa, pa je invarijanta SUM(delta) = stanje točna od prvog dana.
-- -----------------------------------------------------------------------------
INSERT INTO stock_movements (product_id, movement_type, delta_physical, delta_reserved, reference_type, created_by, note)
SELECT p.id, 'INITIAL_STOCK', m.qty, 0, 'DEMO_SEED',
       (SELECT id FROM users WHERE email = 'skladiste@demo.local'),
       'Početno stanje pri uvođenju sustava'
FROM (VALUES
    ('TIR-195-65-15-MI', 24), ('TIR-205-55-16-MI', 32), ('TIR-205-55-16-CO', 28),
    ('TIR-225-45-17-CO', 16), ('TIR-225-50-17-BR', 12), ('TIR-185-65-15-GY', 20),
    ('TIR-235-40-18-PI',  6), ('TIR-175-70-14-SA', 18), ('VEN-STD-01',      400),
    ('VEN-ALU-02',       120), ('VEN-TPMS-03',     14), ('DIO-VIJ-M12',     260),
    ('DIO-MAT-M14',      180), ('DIO-CEN-571',     45), ('POT-UTE-KLI',      60),
    ('POT-UTE-SAM',       48), ('POT-PAS-MON',      9), ('POT-VRE-GUM',     300)
) AS m (sku, qty)
JOIN products p ON p.sku = m.sku;

-- Primka od dobavljača
INSERT INTO stock_movements (product_id, movement_type, delta_physical, delta_reserved, reference_type, created_by, note)
SELECT p.id, 'PURCHASE', m.qty, 0, 'DEMO_SEED',
       (SELECT id FROM users WHERE email = 'skladiste@demo.local'), 'Primka ' || m.doc
FROM (VALUES
    ('TIR-205-55-16-MI', 16, 'P-2024-118'),
    ('TIR-205-55-16-CO', 12, 'P-2024-118'),
    ('VEN-ALU-02',       60, 'P-2024-121')
) AS m (sku, qty, doc)
JOIN products p ON p.sku = m.sku;

-- Korekcija nakon inventure
INSERT INTO stock_movements (product_id, movement_type, delta_physical, delta_reserved, reference_type, created_by, note)
SELECT p.id, 'ADJUSTMENT', -2, 0, 'DEMO_SEED',
       (SELECT id FROM users WHERE email = 'skladiste@demo.local'),
       'Korekcija nakon inventure — oštećenje pri skladištenju'
FROM products p WHERE p.sku = 'TIR-175-70-14-SA';

-- Namjerno ispod minimuma, da dashboard ima što prikazati u "niska zaliha".
INSERT INTO stock_movements (product_id, movement_type, delta_physical, delta_reserved, reference_type, created_by, note)
SELECT p.id, 'ADJUSTMENT', -(p.min_quantity + 2), 0, 'DEMO_SEED',
       (SELECT id FROM users WHERE email = 'skladiste@demo.local'),
       'Demo: artikl doveden ispod minimalne zalihe'
FROM products p WHERE p.sku IN ('TIR-235-40-18-PI', 'POT-PAS-MON');

UPDATE products p SET
    physical_quantity = COALESCE((SELECT SUM(sm.delta_physical) FROM stock_movements sm WHERE sm.product_id = p.id), 0),
    reserved_quantity = COALESCE((SELECT SUM(sm.delta_reserved) FROM stock_movements sm WHERE sm.product_id = p.id), 0);

-- -----------------------------------------------------------------------------
-- Termini.
-- Vezani su na CURRENT_DATE da demo uvijek ima "današnje" termine,
-- bez obzira kad se seed pokrene. Radna mjesta su raspoređena tako da se
-- ne preklapaju — inače bi ih EXCLUDE constraint odbio.
-- -----------------------------------------------------------------------------
INSERT INTO appointments (customer_id, vehicle_id, service_id, bay_id, start_at, end_at, status, customer_note, mechanic_note)
SELECT u.id, v.id, s.id, b.id,
       (CURRENT_DATE + a.day_offset + a.start_time) AT TIME ZONE 'Europe/Zagreb',
       (CURRENT_DATE + a.day_offset + a.start_time + make_interval(mins => s.duration_minutes)) AT TIME ZONE 'Europe/Zagreb',
       a.status, a.customer_note, a.mechanic_note
FROM (VALUES
    -- DANAS: sezonska navala. Jutro je namjerno popunjeno na sva tri radna
    -- mjesta — bez toga tabla termina nikad ne prikaže zauzeto stanje, a upravo
    -- je vidljiva popunjenost ono što demo treba pokazati.
    ('ivan@demo.local',     'ZG1234AB', 'Zamjena sezonskih guma',   'Radno mjesto 1', 0, TIME '08:00', 'COMPLETED',   'Prelazak na zimske.',            'Odrađeno, tlak podešen na 2.3 bara.'),
    ('ana@demo.local',      'ST2233EF', 'Zamjena sezonskih guma',   'Radno mjesto 2', 0, TIME '08:00', 'IN_PROGRESS', NULL,                              NULL),
    ('marko@demo.local',    'RI6677IJ', 'Balansiranje kotača',      'Radno mjesto 3', 0, TIME '08:00', 'COMPLETED',   'Vibracije na 100 km/h.',          'Prednji lijevi kotač jako neuravnotežen.'),
    ('petra@demo.local',    'OS1122KL', 'Krpanje gume',             'Radno mjesto 3', 0, TIME '08:30', 'CONFIRMED',   'Sporo gubi tlak.',                NULL),
    ('ivan@demo.local',     'ZG5678CD', 'Zamjena sezonskih guma',   'Radno mjesto 1', 0, TIME '09:00', 'CONFIRMED',   NULL,                              NULL),
    ('ana@demo.local',      'ST4455GH', 'Popravak gume',            'Radno mjesto 2', 0, TIME '09:00', 'CONFIRMED',   'Vijak u gumi, stražnja desna.',   NULL),
    ('tomislav@demo.local', 'ZD3344MN', 'Zamjena sezonskih guma',   'Radno mjesto 3', 0, TIME '09:00', 'CONFIRMED',   NULL,                              NULL),
    ('marko@demo.local',    'RI8899OP', 'Popravak gume',            'Radno mjesto 1', 0, TIME '10:00', 'CONFIRMED',   NULL,                              NULL),
    ('petra@demo.local',    'OS1122KL', 'Kontrola tlaka i ventila', 'Radno mjesto 2', 0, TIME '10:00', 'PENDING',     NULL,                              NULL),
    ('ivan@demo.local',     'ZG1234AB', 'Hotel za gume (sezona)',   'Radno mjesto 3', 0, TIME '10:00', 'PENDING',     'Ostavljam ljetne na čuvanje.',    NULL),
    ('ana@demo.local',      'ST2233EF', 'Zamjena sezonskih guma',   'Radno mjesto 1', 0, TIME '11:00', 'PENDING',     NULL,                              NULL),
    ('tomislav@demo.local', 'ZD3344MN', 'Krpanje gume',             'Radno mjesto 2', 0, TIME '11:00', 'PENDING',     NULL,                              NULL),
    ('marko@demo.local',    'RI6677IJ', 'Montaža i demontaža',      'Radno mjesto 3', 0, TIME '11:00', 'PENDING',     NULL,                              NULL),
    ('petra@demo.local',    'OS7788QR', 'Balansiranje kotača',      'Radno mjesto 2', 0, TIME '12:00', 'PENDING',     NULL,                              NULL),
    ('ivan@demo.local',     'ZG5678CD', 'Hotel za gume (sezona)',   'Radno mjesto 1', 0, TIME '14:00', 'PENDING',     NULL,                              NULL),
    -- SUTRA: jutro popunjeno na sva tri radna mjesta.
    --
    -- Popunjenost mora sjediti na danu koji posjetitelj STVARNO vidi. Termini u
    -- prošlosti se ne nude, pa demo otvoren poslijepodne ne bi imao što
    -- pokazati da je popunjen samo današnji dan.
    ('ivan@demo.local',     'ZG1234AB', 'Zamjena sezonskih guma',   'Radno mjesto 1', 1, TIME '08:00', 'CONFIRMED',   NULL,                              NULL),
    ('ana@demo.local',      'ST2233EF', 'Zamjena sezonskih guma',   'Radno mjesto 2', 1, TIME '08:00', 'CONFIRMED',   NULL,                              NULL),
    ('marko@demo.local',    'RI6677IJ', 'Balansiranje kotača',      'Radno mjesto 3', 1, TIME '08:00', 'CONFIRMED',   NULL,                              NULL),
    ('petra@demo.local',    'OS1122KL', 'Montaža i demontaža',      'Radno mjesto 3', 1, TIME '08:30', 'CONFIRMED',   NULL,                              NULL),
    ('tomislav@demo.local', 'ZD3344MN', 'Zamjena sezonskih guma',   'Radno mjesto 1', 1, TIME '09:00', 'CONFIRMED',   NULL,                              NULL),
    ('marko@demo.local',    'RI8899OP', 'Krpanje gume',             'Radno mjesto 2', 1, TIME '09:00', 'PENDING',     'Sporo gubi tlak.',                NULL),
    ('ana@demo.local',      'ST4455GH', 'Zamjena sezonskih guma',   'Radno mjesto 3', 1, TIME '09:00', 'CONFIRMED',   NULL,                              NULL),
    ('petra@demo.local',    'OS7788QR', 'Balansiranje kotača',      'Radno mjesto 2', 1, TIME '09:30', 'PENDING',     NULL,                              NULL),
    ('ivan@demo.local',     'ZG5678CD', 'Popravak gume',            'Radno mjesto 1', 1, TIME '10:00', 'PENDING',     NULL,                              NULL),
    ('ivan@demo.local',     'ZG1234AB', 'Kontrola tlaka i ventila', 'Radno mjesto 2', 1, TIME '10:00', 'PENDING',     NULL,                              NULL),
    ('marko@demo.local',    'RI6677IJ', 'Hotel za gume (sezona)',   'Radno mjesto 3', 1, TIME '10:00', 'PENDING',     'Ostavljam ljetne na čuvanje.',    NULL),
    -- PREKOSUTRA: rijetko popunjeno — razlika prema sutra čini nestašicu čitljivom.
    ('ana@demo.local',      'ST2233EF', 'Zamjena sezonskih guma',   'Radno mjesto 1', 2, TIME '09:00', 'CONFIRMED',   NULL,                              NULL),
    ('tomislav@demo.local', 'ZD3344MN', 'Popravak gume',            'Radno mjesto 2', 2, TIME '11:00', 'PENDING',     NULL,                              NULL),
    -- POVIJEST: zatvoreni nalozi, da portal kupca ima što prikazati.
    ('ana@demo.local',      'ST2233EF', 'Zamjena sezonskih guma',   'Radno mjesto 1', -7, TIME '08:00', 'COMPLETED',  NULL,                              'Gume istrošene, preporučena zamjena do proljeća.'),
    ('marko@demo.local',    'RI6677IJ', 'Montaža i demontaža',      'Radno mjesto 2', -7, TIME '10:00', 'NO_SHOW',    NULL,                              'Stranka se nije pojavila.'),
    ('ivan@demo.local',     'ZG5678CD', 'Popravak naplatka',        'Radno mjesto 3', -5, TIME '11:00', 'CANCELLED',  'Ipak idem kod ovlaštenog.',       NULL)
) AS a (email, registration, service_name, bay_name, day_offset, start_time, status, customer_note, mechanic_note)
JOIN users u        ON u.email = a.email
JOIN vehicles v     ON upper(v.registration) = upper(a.registration)
JOIN services s     ON s.name = a.service_name
JOIN service_bays b ON b.name = a.bay_name;

-- Stavke odrađenog termina
INSERT INTO appointment_items (appointment_id, service_id, product_id, description, quantity, unit_price)
SELECT ap.id, s.id, NULL, s.name, 1, s.price
FROM appointments ap
JOIN services s ON s.id = ap.service_id
WHERE ap.status = 'COMPLETED';

INSERT INTO appointment_items (appointment_id, service_id, product_id, description, quantity, unit_price)
SELECT ap.id, NULL, p.id, p.name, 4, p.sale_price
FROM appointments ap
JOIN vehicles v ON v.id = ap.vehicle_id
JOIN products p ON p.sku = 'VEN-STD-01'
WHERE ap.status = 'COMPLETED' AND upper(v.registration) = 'ZG1234AB';

-- Utrošak artikala na odrađenom terminu
INSERT INTO stock_movements (product_id, movement_type, delta_physical, delta_reserved, reference_type, reference_id, created_by, note)
SELECT p.id, 'SERVICE_USAGE', -4, 0, 'APPOINTMENT', ap.id,
       (SELECT id FROM users WHERE email = 'majstor@demo.local'),
       'Utrošeno na servisnom terminu'
FROM appointments ap
JOIN vehicles v ON v.id = ap.vehicle_id
JOIN products p ON p.sku = 'VEN-STD-01'
WHERE ap.status = 'COMPLETED' AND upper(v.registration) = 'ZG1234AB';

-- -----------------------------------------------------------------------------
-- Rezervacije artikala + pripadajući promet.
-- -----------------------------------------------------------------------------
INSERT INTO product_reservations (customer_id, product_id, quantity, unit_price, status, pickup_note)
SELECT u.id, p.id, r.qty, p.sale_price, r.status, r.note
FROM (VALUES
    ('ivan@demo.local',  'TIR-205-55-16-MI', 4, 'CONFIRMED', 'Preuzimam uz termin zamjene guma.'),
    ('ana@demo.local',   'TIR-185-65-15-GY', 2, 'PENDING',   'Javite mi kad stignu.'),
    ('marko@demo.local', 'TIR-225-50-17-BR', 4, 'PENDING',   'Preuzimanje u servisu.'),
    ('ana@demo.local',   'VEN-ALU-02',       4, 'CONFIRMED', NULL)
) AS r (email, sku, qty, status, note)
JOIN users u    ON u.email = r.email
JOIN products p ON p.sku = r.sku;

INSERT INTO stock_movements (product_id, movement_type, delta_physical, delta_reserved, reference_type, reference_id, created_by, note)
SELECT pr.product_id, 'RESERVATION', 0, pr.quantity, 'RESERVATION', pr.id, pr.customer_id, 'Rezervacija artikla'
FROM product_reservations pr
WHERE pr.status IN ('PENDING', 'CONFIRMED');

-- Ponovno izvedi stanje iz knjige prometa nakon rezervacija i utroška.
UPDATE products p SET
    physical_quantity = COALESCE((SELECT SUM(sm.delta_physical) FROM stock_movements sm WHERE sm.product_id = p.id), 0),
    reserved_quantity = COALESCE((SELECT SUM(sm.delta_reserved) FROM stock_movements sm WHERE sm.product_id = p.id), 0);

-- -----------------------------------------------------------------------------
-- Obavijesti (in-app; slanje e-maila je označeno kao budući rad)
-- -----------------------------------------------------------------------------
INSERT INTO notifications (user_id, type, title, body, read_at)
SELECT u.id, n.type, n.title, n.body, n.read_at
FROM (VALUES
    ('ivan@demo.local',  'APPOINTMENT_CONFIRMED', 'Termin je potvrđen',      'Vaš termin za zamjenu sezonskih guma je potvrđen.', NULL::timestamptz),
    ('ana@demo.local',   'RESERVATION_CREATED',   'Rezervacija zaprimljena', 'Zaprimili smo vašu rezervaciju artikala.',           now()),
    ('marko@demo.local', 'APPOINTMENT_REMINDER',  'Podsjetnik na termin',    'Podsjećamo vas na termin u našem servisu.',          NULL)
) AS n (email, type, title, body, read_at)
JOIN users u ON u.email = n.email;
