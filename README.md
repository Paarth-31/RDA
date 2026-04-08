# RDA — Remote Desktop Application

## Project Structure




## Prerequisites
- Node.js 20+
- Docker Desktop (for local PostgreSQL)
- npm 9+

## Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/RDA.git
cd RDA
```

### 2. Set up the database
```bash
# Start PostgreSQL via Docker
docker run --name rda-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=rda \
  -e POSTGRES_USER=rda_app \
  -p 5432:5432 \
  -d postgres:16

# Run the schema
psql -h localhost -U rda_app -d rda -f signaling-server/src/db/schema.sql
```

### 3. Start the signaling server
```bash
cd signaling-server
cp .env.example .env        # fill in your values
npm install
npm run dev
```

### 4. Start the frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Environment Variables
See `.env.example` in each folder for required variables.

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Electron
- **Backend**: Node.js, Express, Socket.io, WebRTC
- **Database**: PostgreSQL 16 (Docker local, AWS RDS production)
- **Security**: ECDH + AES-GCM + HMAC E2E encryption, JWT auth, bcrypt