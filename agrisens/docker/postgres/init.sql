-- ════════════════════════════════════════════════════
-- AGRISENS – Init PostgreSQL
-- ════════════════════════════════════════════════════

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────
-- ENUMS
-- ─────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'fermier', 'technicien', 'observateur');
CREATE TYPE device_status AS ENUM ('online', 'offline', 'maintenance', 'erreur');
CREATE TYPE device_type AS ENUM ('capteur_sol', 'capteur_air', 'station_meteo', 'actionneur', 'gateway');
CREATE TYPE topic_type AS ENUM ('data', 'command', 'status', 'heartbeat');
CREATE TYPE mesure_type AS ENUM (
  'temperature', 'humidite_sol', 'humidite_air', 'ph',
  'conductivite', 'luminosite', 'co2',
  'npk_azote', 'npk_phosphore', 'npk_potassium',
  'pression', 'vitesse_vent', 'pluviometrie'
);
CREATE TYPE alerte_severite AS ENUM ('info', 'warning', 'critical', 'urgence');
CREATE TYPE alerte_statut AS ENUM ('ouverte', 'acquittee', 'resolue', 'ignoree');
CREATE TYPE notif_canal AS ENUM ('email', 'sms', 'push', 'webhook');
CREATE TYPE notif_statut AS ENUM ('en_attente', 'envoye', 'echec', 'annule');
CREATE TYPE log_niveau AS ENUM ('debug', 'info', 'warning', 'error', 'critical');

-- ─────────────────────────────
-- AUTH & ACCÈS
-- ─────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           VARCHAR(100) NOT NULL,
  prenom        VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe  VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'fermier',
  is_active     BOOLEAN DEFAULT true,
  last_login    TIMESTAMP,
  refresh_token TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles_permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role       user_role NOT NULL,
  resource   VARCHAR(100) NOT NULL,
  can_read   BOOLEAN DEFAULT false,
  can_write  BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_admin  BOOLEAN DEFAULT false
);

CREATE TABLE api_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          VARCHAR(150) NOT NULL,
  token        VARCHAR(255) UNIQUE NOT NULL,
  permissions  JSONB,
  expires_at   TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active    BOOLEAN DEFAULT true,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────
-- MÉTIER
-- ─────────────────────────────

CREATE TABLE fermes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          VARCHAR(150) NOT NULL,
  localisation VARCHAR(255),
  latitude     DECIMAL(10,7),
  longitude    DECIMAL(10,7),
  type_culture VARCHAR(100),
  superficie   DECIMAL(10,2),
  is_active    BOOLEAN DEFAULT true,
  owner_id     UUID NOT NULL REFERENCES users(id),
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ferme_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role        VARCHAR(50),
  assigned_at TIMESTAMP DEFAULT NOW(),
  ferme_id    UUID NOT NULL REFERENCES fermes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (ferme_id, user_id)
);

CREATE TABLE parcelles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom          VARCHAR(150) NOT NULL,
  surface      DECIMAL(10,2),
  coord_gps    TEXT,
  latitude     DECIMAL(10,7),
  longitude    DECIMAL(10,7),
  type_culture VARCHAR(100),
  is_active    BOOLEAN DEFAULT true,
  ferme_id     UUID NOT NULL REFERENCES fermes(id) ON DELETE CASCADE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────
-- IoT
-- ─────────────────────────────

CREATE TABLE gateways (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom              VARCHAR(150) NOT NULL,
  ip_address       INET,
  mac_address      VARCHAR(17) UNIQUE,
  firmware_version VARCHAR(50),
  statut           device_status DEFAULT 'offline',
  last_seen        TIMESTAMP,
  last_heartbeat   TIMESTAMP,
  metadata         JSONB,
  ferme_id         UUID NOT NULL REFERENCES fermes(id) ON DELETE CASCADE,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE devices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_uid       VARCHAR(100) UNIQUE NOT NULL,
  nom              VARCHAR(150),
  type_device      device_type NOT NULL,
  firmware_version VARCHAR(50),
  statut           device_status DEFAULT 'offline',
  battery_level    SMALLINT CHECK (battery_level BETWEEN 0 AND 100),
  signal_strength  SMALLINT,
  metadata# Tests unitaires — Auth Service
cat > tests/unit/auth.service.test.js << 'EOF'
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock de la base de données
jest.mock('../../src/config/db', () => {
  const mockDb = jest.fn();
  mockDb.fn = { now: jest.fn(() => new Date()) };
  return mockDb;
});

jest.mock('../../src/utils/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

process.env.JWT_SECRET         = 'test_secret';
process.env.JWT_EXPIRES_IN     = '15m';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const db          = require('../../src/config/db');
const authService = require('../../src/modules/auth/auth.service');
const { userFixture } = require('../fixtures');

describe('AuthService', () => {

  beforeEach(() => { jest.clearAllMocks(); });

  // ─────────────────────────────
  describe('register()', () => {

    it('crée un utilisateur et retourne les tokens', async () => {
      db.mockImplementation((table) => ({
        where:   jest.fn().mockReturnThis(),
        first:   jest.fn().mockResolvedValue(null), // email pas encore pris
        insert:  jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          ...userFixture,
          mot_de_passe: await bcrypt.hash('agrisens123', 1),
        }]),
        update:  jest.fn().mockReturnThis(),
      }));

      const result = await authService.register({
        nom: 'Diallo', prenom: 'Tidiane',
        email: 'tidiane@agrisens.io', motDePasse: 'agrisens123', role: 'admin',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).not.toHaveProperty('mot_de_passe');
      expect(result.user).not.toHaveProperty('refresh_token');
    });

    it('rejette si email déjà utilisé', async () => {
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(userFixture), // email déjà pris
      }));

      await expect(authService.register({
        nom: 'Test', prenom: 'User',
        email: 'tidiane@agrisens.io', motDePasse: 'agrisens123',
      })).rejects.toMatchObject({ message: 'Cet email est déjà utilisé', status: 409 });
    });
  });

  // ─────────────────────────────
  describe('login()', () => {

    it('retourne les tokens avec credentials valides', async () => {
      const hash = await bcrypt.hash('agrisens123', 1);
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ ...userFixture, mot_de_passe: hash }),
        update: jest.fn().mockReturnThis(),
      }));

      const result = await authService.login({
        email: 'tidiane@agrisens.io', motDePasse: 'agrisens123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe('tidiane@agrisens.io');
    });

    it('rejette avec mauvais mot de passe', async () => {
      const hash = await bcrypt.hash('autremdp', 1);
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ ...userFixture, mot_de_passe: hash }),
      }));

      await expect(authService.login({
        email: 'tidiane@agrisens.io', motDePasse: 'mauvais',
      })).rejects.toMatchObject({ status: 401 });
    });

    it('rejette si utilisateur inactif', async () => {
      db.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null), // is_active: false → null
      }));

      await expect(authService.login({
        email: 'inactif@agrisens.io', motDePasse: 'agrisens123',
      })).rejects.toMatchObject({ status: 401 });
    });
  });

  // ─────────────────────────────
  describe('refresh()', () => {

    it('génère un nouveau accessToken avec refresh token valide', async () => {
      const token = jwt.sign({ id: userFixture.id }, 'test_refresh_secret', { expiresIn: '7d' });

      db.mockImplementation(() => ({
        where:  jest.fn().mockReturnThis(),
        first:  jest.fn().mockResolvedValue({ ...userFixture, refresh_token: token }),
        update: jest.fn().mockReturnThis(),
      }));

      const result = await authService.refresh({ refreshToken: token });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('rejette un refresh token expiré', async () => {
      const expiredToken = jwt.sign({ id: userFixture.id }, 'test_refresh_secret', { expiresIn: '-1s' });

      await expect(authService.refresh({ refreshToken: expiredToken }))
        .rejects.toMatchObject({ status: 401 });
    });
  });
});
EOF         JSONB,
  last_seen        TIMESTAMP,
  gateway_id       UUID REFERENCES gateways(id) ON DELETE SET NULL,
  parcelle_id      UUID REFERENCES parcelles(id) ON DELETE SET NULL,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mqtt_topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_name  VARCHAR(255) UNIQUE NOT NULL,
  topic_type  topic_type,
  qos         SMALLINT DEFAULT 1 CHECK (qos IN (0,1,2)),
  retain      BOOLEAN DEFAULT false,
  is_active   BOOLEAN DEFAULT true,
  device_id   UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────
-- DONNÉES
-- ─────────────────────────────

CREATE TABLE capteurs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_mesure         mesure_type NOT NULL,
  unite               VARCHAR(20) NOT NULL,
  precision           DECIMAL(5,2),
  range_min           DECIMAL(10,4),
  range_max           DECIMAL(10,4),
  influx_measurement  VARCHAR(100) NOT NULL,
  influx_field        VARCHAR(100) NOT NULL,
  is_active           BOOLEAN DEFAULT true,
  device_id           UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lectures_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  derniere_valeur  DECIMAL(12,4),
  unite            VARCHAR(20),
  qualite          SMALLINT CHECK (qualite BETWEEN 0 AND 100),
  influx_timestamp TIMESTAMP NOT NULL,
  updated_at       TIMESTAMP DEFAULT NOW(),
  capteur_id       UUID UNIQUE NOT NULL REFERENCES capteurs(id) ON DELETE CASCADE,
  device_id        UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE
);

CREATE TABLE agregats_journaliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL,
  valeur_min      DECIMAL(12,4),
  valeur_max      DECIMAL(12,4),
  valeur_moy      DECIMAL(12,4),
  valeur_mediane  DECIMAL(12,4),
  ecart_type      DECIMAL(12,4),
  nb_mesures      INTEGER,
  qualite_globale SMALLINT,
  capteur_id      UUID NOT NULL REFERENCES capteurs(id) ON DELETE CASCADE,
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE (capteur_id, date)
);

-- ─────────────────────────────
-- SUPERVISION
-- ─────────────────────────────

CREATE TABLE parametres_seuil (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               VARCHAR(150),
  valeur_min        DECIMAL(12,4),
  valeur_max        DECIMAL(12,4),
  duree_depassement INTEGER DEFAULT 0,
  severite          alerte_severite DEFAULT 'warning',
  is_active         BOOLEAN DEFAULT true,
  capteur_id        UUID NOT NULL REFERENCES capteurs(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alertes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_alerte      VARCHAR(100) NOT NULL,
  severite         alerte_severite DEFAULT 'warning',
  message          TEXT NOT NULL,
  statut           alerte_statut DEFAULT 'ouverte',
  valeur_mesuree   DECIMAL(12,4),
  influx_timestamp TIMESTAMP,
  acquitte_at      TIMESTAMP,
  resolue_at       TIMESTAMP,
  seuil_id         UUID REFERENCES parametres_seuil(id) ON DELETE SET NULL,
  capteur_id       UUID REFERENCES capteurs(id) ON DELETE SET NULL,
  device_id        UUID REFERENCES devices(id) ON DELETE SET NULL,
  acquitte_par     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canal         notif_canal NOT NULL,
  destinataire  VARCHAR(255) NOT NULL,
  sujet         VARCHAR(255),
  contenu       TEXT,
  statut        notif_statut DEFAULT 'en_attente',
  tentatives    SMALLINT DEFAULT 0,
  max_tentatives SMALLINT DEFAULT 3,
  error_message TEXT,
  sent_at       TIMESTAMP,
  alerte_id     UUID NOT NULL REFERENCES alertes(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────
-- SYSTÈME
-- ─────────────────────────────

CREATE TABLE logs_systeme (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service    VARCHAR(100) NOT NULL,
  niveau     log_niveau NOT NULL,
  message    TEXT NOT NULL,
  stack      TEXT,
  context    JSONB,
  ip_address INET,
  timestamp  TIMESTAMP DEFAULT NOW(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  device_id  UUID REFERENCES devices(id) ON DELETE SET NULL,
  gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL
);

-- ─────────────────────────────
-- INDEX
-- ─────────────────────────────

CREATE INDEX idx_logs_timestamp  ON logs_systeme(timestamp DESC);
CREATE INDEX idx_logs_niveau     ON logs_systeme(niveau);
CREATE INDEX idx_logs_service    ON logs_systeme(service);
CREATE INDEX idx_alertes_statut  ON alertes(statut);
CREATE INDEX idx_alertes_device  ON alertes(device_id);
CREATE INDEX idx_lectures_device ON lectures_cache(device_id);
CREATE INDEX idx_devices_gateway ON devices(gateway_id);
CREATE INDEX idx_devices_parcelle ON devices(parcelle_id);

-- ─────────────────────────────
-- SEED – Rôles & permissions
-- ─────────────────────────────

INSERT INTO roles_permissions (role, resource, can_read, can_write, can_delete, can_admin) VALUES
  ('admin',       'fermes',     true, true, true,  true),
  ('admin',       'devices',    true, true, true,  true),
  ('admin',       'users',      true, true, true,  true),
  ('admin',       'logs',       true, true, true,  true),
  ('fermier',     'fermes',     true, true, false, false),
  ('fermier',     'devices',    true, true, false, false),
  ('fermier',     'alertes',    true, true, false, false),
  ('technicien',  'devices',    true, true, true,  false),
  ('technicien',  'gateways',   true, true, true,  false),
  ('technicien',  'alertes',    true, true, false, false),
  ('observateur', 'fermes',     true, false, false, false),
  ('observateur', 'alertes',    true, false, false, false),
  ('observateur', 'lectures',   true, false, false, false);
