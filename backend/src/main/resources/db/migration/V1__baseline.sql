-- =============================================================================
--  Vulkanizer demo — baseline shema
--  Single-tenant. Sav tekst domene (nazivi) je na engleskom; UI prevodi.
-- =============================================================================

-- Potrebno za EXCLUDE constraint nad (bay_id, vremenski raspon).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- -----------------------------------------------------------------------------
-- Korisnici i uloge
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(32)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT roles_name_ck CHECK (name IN ('CUSTOMER', 'EMPLOYEE', 'WAREHOUSE_WORKER', 'ADMIN'))
);

CREATE TABLE users (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(100) NOT NULL,
    full_name      VARCHAR(160) NOT NULL,
    phone          VARCHAR(32),
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- E-mail je jedinstven bez obzira na velika/mala slova.
CREATE UNIQUE INDEX ux_users_email_lower ON users (lower(email));

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles (id),
    PRIMARY KEY (user_id, role_id)
);
CREATE INDEX ix_user_roles_role ON user_roles (role_id);

-- -----------------------------------------------------------------------------
-- Vozila
-- -----------------------------------------------------------------------------
CREATE TABLE vehicles (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    make         VARCHAR(80)  NOT NULL,
    model        VARCHAR(80)  NOT NULL,
    model_year   INT,
    registration VARCHAR(20)  NOT NULL,
    tire_size    VARCHAR(40),
    vin          VARCHAR(32),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT vehicles_year_ck CHECK (model_year IS NULL OR (model_year BETWEEN 1900 AND 2100))
);
CREATE UNIQUE INDEX ux_vehicles_registration ON vehicles (upper(registration));
CREATE INDEX ix_vehicles_user ON vehicles (user_id);

-- -----------------------------------------------------------------------------
-- Usluge, radna mjesta, radno vrijeme
-- -----------------------------------------------------------------------------
CREATE TABLE services (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name             VARCHAR(120)   NOT NULL UNIQUE,
    description      VARCHAR(1000),
    price            NUMERIC(12, 2) NOT NULL,
    duration_minutes INT            NOT NULL,
    active           BOOLEAN        NOT NULL DEFAULT TRUE,
    sort_order       INT            NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT services_price_ck    CHECK (price >= 0),
    CONSTRAINT services_duration_ck CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);
CREATE INDEX ix_services_active ON services (active);

-- Kapacitet servisa po terminu = broj aktivnih radnih mjesta.
CREATE TABLE service_bays (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name       VARCHAR(60) NOT NULL UNIQUE,
    active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE working_hours (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    day_of_week INT         NOT NULL UNIQUE,
    open_time   TIME,
    close_time  TIME,
    closed      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT working_hours_dow_ck   CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT working_hours_range_ck CHECK (closed OR (open_time IS NOT NULL AND close_time IS NOT NULL AND close_time > open_time))
);

-- -----------------------------------------------------------------------------
-- Termini
-- -----------------------------------------------------------------------------
CREATE TABLE appointments (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id   BIGINT       NOT NULL REFERENCES users (id),
    vehicle_id    BIGINT       NOT NULL REFERENCES vehicles (id),
    service_id    BIGINT       NOT NULL REFERENCES services (id),
    bay_id        BIGINT       NOT NULL REFERENCES service_bays (id),
    start_at      TIMESTAMPTZ  NOT NULL,
    end_at        TIMESTAMPTZ  NOT NULL,
    status        VARCHAR(16)  NOT NULL DEFAULT 'PENDING',
    customer_note VARCHAR(1000),
    mechanic_note VARCHAR(2000),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT appointments_status_ck CHECK (status IN
        ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    CONSTRAINT appointments_range_ck  CHECK (end_at > start_at),

    -- Jedino mjesto na kojem se sprječava dvostruka rezervacija.
    -- Deklarativno, bez aplikacijskog zaključavanja; otkazani i nedolazak
    -- ispadaju iz predikata pa automatski oslobađaju termin.
    CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
        bay_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
    ) WHERE (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'))
);
CREATE INDEX ix_appointments_start        ON appointments (start_at);
CREATE INDEX ix_appointments_customer     ON appointments (customer_id, start_at DESC);
CREATE INDEX ix_appointments_status_start ON appointments (status, start_at);
CREATE INDEX ix_appointments_vehicle      ON appointments (vehicle_id);

-- -----------------------------------------------------------------------------
-- Artikli i kategorije
-- -----------------------------------------------------------------------------
CREATE TABLE product_categories (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code       VARCHAR(40)  NOT NULL UNIQUE,
    name       VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE products (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku               VARCHAR(64)    NOT NULL UNIQUE,
    name              VARCHAR(200)   NOT NULL,
    manufacturer      VARCHAR(120),
    category_id       BIGINT         NOT NULL REFERENCES product_categories (id),
    description       VARCHAR(2000),
    tire_size         VARCHAR(40),
    sale_price        NUMERIC(12, 2) NOT NULL,
    purchase_price    NUMERIC(12, 2),
    physical_quantity INT            NOT NULL DEFAULT 0,
    reserved_quantity INT            NOT NULL DEFAULT 0,
    min_quantity      INT            NOT NULL DEFAULT 0,
    active            BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT products_sale_price_ck     CHECK (sale_price >= 0),
    CONSTRAINT products_purchase_price_ck CHECK (purchase_price IS NULL OR purchase_price >= 0),
    CONSTRAINT products_physical_ck       CHECK (physical_quantity >= 0),
    CONSTRAINT products_reserved_ck       CHECK (reserved_quantity >= 0),
    CONSTRAINT products_min_ck            CHECK (min_quantity >= 0),
    -- Stvarna mreža sigurnosti protiv prodaje ispod nule.
    CONSTRAINT products_not_oversold_ck   CHECK (reserved_quantity <= physical_quantity)
);
CREATE INDEX ix_products_category ON products (category_id);
CREATE INDEX ix_products_active   ON products (active);
CREATE INDEX ix_products_name     ON products (lower(name));

-- Revizijski trag svake promjene zalihe. Nikad se ne briše.
CREATE TABLE stock_movements (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id     BIGINT      NOT NULL REFERENCES products (id),
    movement_type  VARCHAR(20) NOT NULL,
    delta_physical INT         NOT NULL,
    delta_reserved INT         NOT NULL,
    reference_type VARCHAR(30),
    reference_id   BIGINT,
    created_by     BIGINT      REFERENCES users (id),
    note           VARCHAR(500),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT stock_movements_type_ck CHECK (movement_type IN
        ('INITIAL_STOCK', 'PURCHASE', 'RESERVATION', 'RELEASE', 'SERVICE_USAGE', 'ADJUSTMENT'))
);
CREATE INDEX ix_stock_movements_product ON stock_movements (product_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Rezervacije artikala
-- -----------------------------------------------------------------------------
CREATE TABLE product_reservations (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id    BIGINT         NOT NULL REFERENCES users (id),
    product_id     BIGINT         NOT NULL REFERENCES products (id),
    appointment_id BIGINT         REFERENCES appointments (id),
    quantity       INT            NOT NULL,
    unit_price     NUMERIC(12, 2) NOT NULL,
    status         VARCHAR(16)    NOT NULL DEFAULT 'PENDING',
    pickup_note    VARCHAR(500),
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT product_reservations_qty_ck    CHECK (quantity > 0),
    CONSTRAINT product_reservations_price_ck  CHECK (unit_price >= 0),
    CONSTRAINT product_reservations_status_ck CHECK (status IN
        ('PENDING', 'CONFIRMED', 'FULFILLED', 'CANCELLED'))
);
CREATE INDEX ix_reservations_customer    ON product_reservations (customer_id, created_at DESC);
CREATE INDEX ix_reservations_product     ON product_reservations (product_id);
CREATE INDEX ix_reservations_status      ON product_reservations (status);
CREATE INDEX ix_reservations_appointment ON product_reservations (appointment_id);

-- -----------------------------------------------------------------------------
-- Stavke termina (utrošene usluge i artikli)
-- -----------------------------------------------------------------------------
CREATE TABLE appointment_items (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id BIGINT         NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
    product_id     BIGINT         REFERENCES products (id),
    service_id     BIGINT         REFERENCES services (id),
    description    VARCHAR(200)   NOT NULL,
    quantity       INT            NOT NULL,
    unit_price     NUMERIC(12, 2) NOT NULL,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT appointment_items_qty_ck   CHECK (quantity > 0),
    CONSTRAINT appointment_items_price_ck CHECK (unit_price >= 0),
    -- Stavka je ili artikl ili usluga, nikad oboje i nikad ništa.
    CONSTRAINT appointment_items_ref_ck   CHECK (num_nonnulls(product_id, service_id) = 1)
);
CREATE INDEX ix_appointment_items_appointment ON appointment_items (appointment_id);

-- -----------------------------------------------------------------------------
-- Obavijesti i revizijski zapisi
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type       VARCHAR(40)  NOT NULL,
    title      VARCHAR(200) NOT NULL,
    body       VARCHAR(1000) NOT NULL,
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX ix_notifications_user ON notifications (user_id, created_at DESC);

CREATE TABLE audit_logs (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_id    BIGINT      REFERENCES users (id),
    entity_type VARCHAR(60) NOT NULL,
    entity_id   BIGINT,
    action      VARCHAR(60) NOT NULL,
    details     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_logs_entity ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX ix_audit_logs_actor  ON audit_logs (actor_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- Šifrarnici koji nisu demo podaci — potrebni su i produkciji.
-- -----------------------------------------------------------------------------
INSERT INTO roles (name) VALUES ('CUSTOMER'), ('EMPLOYEE'), ('WAREHOUSE_WORKER'), ('ADMIN');

INSERT INTO product_categories (code, name) VALUES
    ('TIRES',       'Gume'),
    ('CAR_PARTS',   'Autodijelovi'),
    ('VALVES',      'Ventili'),
    ('CONSUMABLES', 'Potrošni materijal'),
    ('OTHER',       'Ostalo');
