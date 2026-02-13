# Decentralized On-Chain Governance Platform

A full-stack DApp for on-chain governance using **GovernanceToken** (ERC20Votes) and **MyGovernor** (OpenZeppelin Governor). Supports **Standard** (1 token = 1 vote) and **Quadratic Voting** (cost = votes²).

## Features
- **Governance Token**: ERC20 token with voting and delegation capabilities.
- **MyGovernor**: 
  - **Standard Voting**: Pure token weight (1 token = 1 vote).
  - **Quadratic Voting**: Cost = Votes², paid in tokens. Tokens transferred to burn address on vote.
- **Frontend**: Next.js dashboard to create proposals, delegate votes, and cast votes.
- **Dockerized**: One-command startup with `docker-compose up`.

## Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js v20+ (for local development without Docker)

## Quick Start (Docker)
```bash
# 1. Clone the repository
git clone <repository-url>
cd On_Chain_Goverance

# 2. (Optional) Create .env from .env.example
cp .env.example .env

# 3. Build and start all services
docker-compose up --build

# 4. Access the services:
#    Frontend:      http://localhost:3000
#    Hardhat Node:  http://localhost:8545
```

The Hardhat node starts and **automatically deploys** the GovernanceToken and MyGovernor contracts. The frontend is pre-built and served in production mode.

## Manual Setup (Development)

### Smart Contracts
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local node
npx hardhat node

# Deploy (in another terminal)
npx hardhat run scripts/deploy.js --network localhost
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Project Structure
```
├── contracts/
│   ├── GovernanceToken.sol     # ERC20 + ERC20Votes token
│   └── MyGovernor.sol          # Governor with Standard + Quadratic voting
├── scripts/
│   ├── deploy.js               # Deployment script
│   └── start-node.sh           # Docker entrypoint (node + deploy)
├── test/
│   └── Governor.test.js        # Contract tests
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main governance dashboard
│   │   ├── components/         # ConnectWallet component
│   │   ├── constants.ts        # Contract addresses and ABIs
│   │   └── abi/                # Contract ABI JSON files
│   ├── Dockerfile.frontend     # Frontend Docker image
│   └── package.json
├── Dockerfile.hardhat          # Hardhat node Docker image
├── docker-compose.yml          # Orchestration
├── .env.example                # Environment variable template
└── hardhat.config.js           # Hardhat configuration
```

## Architecture
- **Smart Contracts**: Solidity 0.8.24 (Cancun EVM), OpenZeppelin v5
- **Frontend**: Next.js 16, Tailwind CSS v4, Ethers.js v6
- **Testing**: Hardhat + Chai + Mocha
- **Containerization**: Docker + Docker Compose

## Quadratic Voting Logic
For proposals marked as Quadratic:
- User specifies desired votes **V**.
- Cost **C = V²** tokens (scaled by 18 decimals).
- User must first `approve()` the Governor contract to spend **C** tokens.
- Tokens are transferred to a burn address (`0xdEaD`) upon voting.
- The voter receives **V** units of voting weight.

## Environment Variables
See [`.env.example`](.env.example) for all available configuration. The Docker setup works out of the box without any `.env` file for local development.