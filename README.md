## Transactions API

### Setup

Create a .env file based on the .env.example file, then:

```bash
pnpm install
```

## Run the project

Run the db:

```bash
docker-compose up db -d
```

Run the API:

```bash
pnpm start:dev
```

Or optionally you can run both with:

```bash
docker-compose up -d
```

## Run tests

```bash
# unit tests
pnpm test

# e2e tests
pnpm test:e2e

# test coverage
pnpm test:cov
```
