# Pinned versions (verified against the npm registry on 25 Oct 2026)

| Package | Version | Note |
|---|---|---|
| Node.js | 22.x (>=22.12) | Required by Prisma 7 and Hardhat 3 |
| hardhat | 3.21.0 | Hardhat 3 API: `defineConfig`, `network.create()`, node:test runner |
| @nomicfoundation/hardhat-toolbox-viem | 5.0.7 | Peers on hardhat ^3.8, viem ^2.47.6 |
| @openzeppelin/contracts | 5.6.1 | |
| solc | 0.8.28 | |
| viem | 2.57.11 | One web3 library everywhere (no ethers) |
| wagmi | 3.7.9 | Needs viem 2.x, TypeScript >=5.9.3, TanStack Query >=5 |
| @tanstack/react-query | 5.104.5 | |
| next | 16.4.3 | |
| react / react-dom | 19.3.1 | |
| tailwindcss / @tailwindcss/postcss | 4.3.3 | |
| recharts | 3.10.1 | |
| react-hook-form | 7.91.0 | |
| zod | 4.6.7 | |
| siwe | 3.0.0 | |
| prisma / @prisma/client | 7.10.1 | `latest` tag currently points to 8.0.0-rc, deliberately NOT used |
| typescript | 5.9.3 | 7.x exists but wagmi/Prisma/Next are not validated against it |

Re-verify with `npm view <pkg> version` before changing anything.
