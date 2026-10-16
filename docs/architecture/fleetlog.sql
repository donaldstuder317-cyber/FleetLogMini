-- FleetLog Mini - PostgreSQL schema (drawSQL import)
-- reading_unit  : mi | hrs
-- interval_unit : mi | hrs | days
-- task          : Oil change | Brakes | Tire rotation | Inspection | Other
--                 (schedules.task is never Other)

CREATE TABLE users (
  id            UUID PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          VARCHAR(120) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assets (
  id         UUID PRIMARY KEY,
  owner_id   UUID,
  name       VARCHAR(120) NOT NULL,
  kind       VARCHAR(60) NOT NULL,
  model      VARCHAR(120) NOT NULL,
  reading    NUMERIC(10,1) NOT NULL DEFAULT 0,
  reading_unit VARCHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE schedules (
  id             UUID PRIMARY KEY,
  asset_id       UUID NOT NULL,
  task           VARCHAR(30) NOT NULL,
  interval_value INTEGER NOT NULL,
  interval_unit  VARCHAR(4) NOT NULL,
  last_reading   NUMERIC(10,1) NOT NULL DEFAULT 0,
  last_date      DATE NOT NULL
);

CREATE TABLE service_entries (
  id           UUID PRIMARY KEY,
  asset_id     UUID NOT NULL,
  task         VARCHAR(30) NOT NULL,
  service_date DATE NOT NULL,
  reading      NUMERIC(10,1) NOT NULL,
  parts_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE faults (
  id          UUID PRIMARY KEY,
  asset_id    UUID NOT NULL,
  fault_date  DATE NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE assets ADD FOREIGN KEY (owner_id) REFERENCES users (id);
ALTER TABLE schedules ADD FOREIGN KEY (asset_id) REFERENCES assets (id);
ALTER TABLE service_entries ADD FOREIGN KEY (asset_id) REFERENCES assets (id);
ALTER TABLE faults ADD FOREIGN KEY (asset_id) REFERENCES assets (id);

CREATE INDEX idx_assets_owner_id ON assets (owner_id);
CREATE INDEX idx_schedules_asset_id ON schedules (asset_id);
CREATE INDEX idx_service_entries_asset_id ON service_entries (asset_id);
CREATE INDEX idx_faults_asset_id ON faults (asset_id);
