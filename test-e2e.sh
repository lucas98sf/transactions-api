#!/bin/bash
export $(grep -v '^#' .env.test | xargs)

docker compose -f docker-compose.test.yml up -d

echo "Waiting for the database to start..."
until docker exec -it $(docker ps -q -f "name=test-db") pg_isready -U testuser; do
  sleep 1
done

echo "Running Prisma migrations..."
pnpm prisma migrate deploy --schema=src/prisma/schema.prisma

echo "Running e2e tests..."
pnpm jest --config ./test/jest-e2e.json

docker compose -f docker-compose.test.yml down