# CapitalFlow

Educational prototype of a blockchain-enabled SME invoice-financing platform.
**Test tokens only. Not a lender, not a regulated platform, no real INR.**

Status: Phases 1-3 complete (architecture, environment, smart contracts + 44 passing tests). Backend and frontend follow.
The full README (architecture, demo walkthrough, troubleshooting) is written in later phases.

## Prerequisites
- Node.js 22.12+ and npm 10+
- Git
- Docker Desktop (for local PostgreSQL) or a hosted Postgres URL
- MetaMask browser extension

## Quick start (Windows PowerShell, from the repo root)
```powershell
npm install
npm run contracts:compile
npm run contracts:test
```
macOS/Linux: identical commands.

Copy `.env.example` to `.env` (`Copy-Item .env.example .env` on PowerShell).

## Smart contracts (Phase 3)
Details, roles, money flow and known risks: [`docs/smart-contracts.md`](docs/smart-contracts.md).

```powershell
# from the repo root
npm run contracts:test            # 44 tests on the in-process Hardhat network

# local chain: two terminals, both from the repo root
npm run contracts:node            # terminal 1: keep running
npm run contracts:deploy:local    # terminal 2: deploy, grant roles, seed test tokens, export ABIs
npm run contracts:verify:local    # terminal 2: reads roles back from the chain (15 checks)
```
Deployment exports `contracts/deployments/31337.json` and `frontend/lib/contracts/{addresses.json,abis/}`.
Restarting `contracts:node` wipes the chain: redeploy afterwards (and reset MetaMask's account activity for the local network).
