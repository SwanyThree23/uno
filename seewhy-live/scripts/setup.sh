#!/bin/bash
# scripts/setup.sh — First-time developer setup for SeeWhy LIVE

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════╗"
echo "║     SeeWhy LIVE — Dev Setup          ║"
echo "║     by SwanyThree EntTech            ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ $1 is required but not installed${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ $1 found${NC}"
}

echo "Checking prerequisites..."
check_cmd node
check_cmd npm
check_cmd docker
check_cmd openssl

# Install root dependencies
echo -e "\n${CYAN}Installing workspace dependencies...${NC}"
npm install

# Generate JWT RSA key pair
echo -e "\n${CYAN}Generating RSA key pair for JWT...${NC}"
mkdir -p apps/api/keys
if [ ! -f apps/api/keys/private.pem ]; then
  openssl genrsa -out apps/api/keys/private.pem 4096
  openssl rsa -in apps/api/keys/private.pem -pubout -out apps/api/keys/public.pem
  echo -e "${GREEN}✓ RSA keys generated${NC}"
else
  echo -e "${YELLOW}⚠ RSA keys already exist, skipping${NC}"
fi

# Copy env file if not exists
echo -e "\n${CYAN}Setting up environment...${NC}"
if [ ! -f apps/api/.env ]; then
  cp .env apps/api/.env 2>/dev/null || true
fi

# Start Docker services
echo -e "\n${CYAN}Starting Docker services (postgres + redis)...${NC}"
docker compose up -d postgres redis

# Wait for postgres
echo -e "${CYAN}Waiting for PostgreSQL...${NC}"
until docker compose exec postgres pg_isready -U seewhy -d seewhy_live &>/dev/null; do
  sleep 1
done
echo -e "${GREEN}✓ PostgreSQL ready${NC}"

# Wait for Redis
echo -e "${CYAN}Waiting for Redis...${NC}"
until docker compose exec redis redis-cli ping &>/dev/null; do
  sleep 1
done
echo -e "${GREEN}✓ Redis ready${NC}"

# Run Prisma migrations
echo -e "\n${CYAN}Running database migrations...${NC}"
cd apps/api
npx prisma migrate dev --name init --skip-seed
npx prisma generate
cd ../..
echo -e "${GREEN}✓ Migrations complete${NC}"

# Run seed
echo -e "\n${CYAN}Seeding database...${NC}"
cd apps/api
npx tsx ../../scripts/seed.ts
cd ../..
echo -e "${GREEN}✓ Database seeded${NC}"

echo -e "\n${GREEN}╔══════════════════════════════════════╗"
echo "║     Setup Complete! 🎉               ║"
echo "╚══════════════════════════════════════╝${NC}"
echo ""
echo "Start development servers:"
echo -e "  ${CYAN}npm run dev:api${NC}  →  http://localhost:3001"
echo -e "  ${CYAN}npm run dev:web${NC}  →  http://localhost:3000"
echo ""
echo "Test accounts:"
echo "  Admin:   admin@seewhylive.com / Admin1234!"
echo "  Creator: maya@example.com / Creator1234!"
