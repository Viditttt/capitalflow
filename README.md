# CapitalFlow

Educational prototype of a blockchain-enabled SME invoice-financing platform.
**Test tokens only. Not a lender, not a regulated platform, no real INR.**

Status: Phase 2 (environment) complete. Contracts, backend and frontend follow.
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
