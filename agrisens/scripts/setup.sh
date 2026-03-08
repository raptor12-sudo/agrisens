#!/bin/bash
# ════════════════════════════════════════
# AGRISENS – Script de setup initial
# Usage : bash scripts/setup.sh
# ════════════════════════════════════════

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🌱 AgriSens – Setup de l'environnement${NC}\n"

# 1. Copier .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${YELLOW}⚠️  Fichier .env créé depuis .env.example"
  echo -e "   👉 Modifie les valeurs dans .env avant de continuer${NC}\n"
else
  echo -e "✅ .env déjà présent\n"
fi

# 2. Créer le fichier passwd Mosquitto
if [ ! -f docker/mosquitto/passwd ]; then
  touch docker/mosquitto/passwd
  echo -e "✅ Fichier passwd Mosquitto créé\n"
  echo -e "${YELLOW}   👉 Ajouter un user MQTT avec :"
  echo -e "      docker run --rm -v \$(pwd)/docker/mosquitto:/mosquitto eclipse-mosquitto mosquitto_passwd -b /mosquitto/config/passwd agrisens_broker TON_MOT_DE_PASSE${NC}\n"
fi

# 3. Installer les dépendances npm
echo "📦 Installation des dépendances npm..."
npm install
echo -e "✅ npm install terminé\n"

# 4. Démarrer Docker
echo "🐳 Démarrage des conteneurs Docker..."
docker compose up -d --build
echo -e "✅ Conteneurs démarrés\n"

# 5. Attendre PostgreSQL
echo "⏳ Attente de PostgreSQL..."
until docker exec agrisens_postgres pg_isready -U agrisens_user -d agrisens > /dev/null 2>&1; do
  sleep 2
done
echo -e "✅ PostgreSQL prêt\n"

# 6. Vérification finale
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Environnement AgriSens prêt !${NC}"
echo ""
echo "  📡 API         → http://localhost:$(grep API_PORT .env | cut -d= -f2)/health"
echo "  🗄  pgAdmin     → http://localhost:5050"
echo "  📊 InfluxDB    → http://localhost:$(grep INFLUX_PORT .env | cut -d= -f2)"
echo ""
echo -e "${YELLOW}  👉 Lancer en mode dev : npm run dev${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
