# 🌱 AgriSens API

> Plateforme IoT de monitoring agricole — Node.js / Express · PostgreSQL · InfluxDB · MQTT

---

## 🚀 Démarrage rapide

```bash
# 1. Cloner le projet
git clone https://github.com/ton-user/agrisens.git
cd agrisens

# 2. Lancer le setup automatique
bash scripts/setup.sh

# 3. Configurer les variables d'environnement
nano .env

# 4. Démarrer en mode développement
npm run dev
```

---

## 🏗 Structure du projet

```
agrisens/
├── docker/
│   ├── Dockerfile.dev
│   ├── mosquitto/
│   │   └── mosquitto.conf
│   └── postgres/
│       └── init.sql          ← Schéma complet + ENUMs + seed
├── scripts/
│   └── setup.sh
├── src/
│   ├── config/
│   │   ├── db.js             ← Knex (PostgreSQL)
│   │   ├── influx.js         ← InfluxDB client
│   │   ├── migrations/       ← Knex migrations
│   │   └── seeds/            ← Données de test
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── modules/              ← Un dossier par domaine métier
│   │   ├── auth/
│   │   ├── fermes/
│   │   ├── parcelles/
│   │   ├── gateways/
│   │   ├── devices/
│   │   ├── capteurs/
│   │   ├── alertes/
│   │   ├── notifications/
│   │   └── logs/
│   ├── services/
│   │   ├── mqtt/             ← MQTT subscriber + handler
│   │   ├── influx/           ← Read/Write InfluxDB
│   │   ├── cron/             ← Jobs d'agrégation
│   │   └── notifications/    ← Email / SMS / Push / Webhook
│   ├── utils/
│   │   └── logger.js         ← Winston
│   ├── app.js
│   └── index.js
├── .env.example
├── .gitignore
├── docker-compose.yml
├── knexfile.js
└── package.json
```

---

## 🐳 Services Docker

| Service       | URL                        | Credentials (.env)              |
|---------------|----------------------------|---------------------------------|
| API           | http://localhost:3000      | —                               |
| PostgreSQL    | localhost:5432             | POSTGRES_USER / PASSWORD        |
| InfluxDB      | http://localhost:8086      | INFLUX_USER / PASSWORD          |
| Mosquitto     | mqtt://localhost:1883      | MQTT_USERNAME / PASSWORD        |
| pgAdmin       | http://localhost:5050      | PGADMIN_EMAIL / PASSWORD        |

```bash
# Démarrer tous les services
docker compose up -d

# Démarrer avec pgAdmin (optionnel)
docker compose --profile tools up -d

# Voir les logs
docker compose logs -f api

# Arrêter
docker compose down
```

---

## 📡 Topics MQTT

```
agrisens/{fermeId}/{deviceUID}/data        ← Mesures capteurs
agrisens/{fermeId}/{deviceUID}/status      ← Statut device
agrisens/{fermeId}/{deviceUID}/heartbeat   ← Heartbeat gateway
agrisens/{fermeId}/{deviceUID}/command     ← Commandes vers device
```

---

## 🗄 Base de données

```bash
# Lancer les migrations
npm run migrate

# Rollback
npm run migrate:rollback

# Seed de données de test
npm run seed
```

---

## 🧪 Tests

```bash
npm test
npm run test:watch
```

---

## 📋 Phases de développement

Voir [checklist complète](./agrisens-checklist.md)

- [x] Phase 0 — Setup & Infrastructure
- [ ] Phase 1 — Auth & Sécurité
- [ ] Phase 2 — Couche Métier
- [ ] Phase 3 — Couche IoT
- [ ] Phase 4 — Couche Données
- [ ] Phase 5 — Supervision & Alertes
- [ ] Phase 6 — Logs & Monitoring
- [ ] Phase 7 — Frontend / Dashboard
- [ ] Phase 8 — Tests
- [ ] Phase 9 — Déploiement
