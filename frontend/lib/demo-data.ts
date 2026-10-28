export interface DemoInvoice {
  id: string
  invoiceNumber: string
  buyerName: string
  buyerGstin: string
  supplierAddress: string
  supplierName: string
  faceValue: bigint
  issueDate: number
  dueDate: number
  status: number // 1: Submitted, 2: Verified, 3: Rejected, 4: Flagged, 5: Financed, 6: Settled, 7: Disputed
  documentHash: string
  invoiceKey: string
  riskScore: number
  sector: string
  description: string
  goodsSummary: string
  offersCount: number
  bestOfferRate?: number
}

export interface DemoOffer {
  id: string
  invoiceId: string
  financierAddress: string
  financierName: string
  principal: bigint
  fee: bigint
  advanceRateBps: number
  validitySeconds: number
  expiryTimestamp: number
  status: number // 1: Open, 2: Accepted, 3: Cancelled, 4: Expired, 5: Voided
  impliedApr: number
}

export interface DemoFinancing {
  id: string
  invoiceId: string
  offerId: string
  supplierAddress: string
  financierAddress: string
  principal: bigint
  fee: bigint
  serviceFee: bigint
  totalDue: bigint
  fundedAt: number
  maturity: number
  settledAt?: number
  status: number // 1: Active, 2: Settled
}

const NOW = Math.floor(Date.now() / 1000)
const DAY = 86400

export const INITIAL_DEMO_INVOICES: DemoInvoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-0081',
    buyerName: 'Tata Motors Passenger Vehicles Ltd',
    buyerGstin: '27AAACT2727Q1ZW',
    supplierAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    supplierName: 'Apex Precision Auto-Components Pvt Ltd',
    faceValue: 1_000_000_000_000n, // Rs 10,00,000 (with 6 decimals = 1,000,000 * 10^6)
    issueDate: NOW - 12 * DAY,
    dueDate: NOW + 48 * DAY,
    status: 2, // Verified
    documentHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    invoiceKey: '0x9b4c09d2243c2d431bb53a479ffac758d46fb1f2c9ff506d15664be87d853e39',
    riskScore: 92,
    sector: 'Automotive & Heavy Engineering',
    description: 'Precision forged gear rings and transmission pinions for EV platform assembly.',
    goodsSummary: '2,500 units Transmission Pinions (Part #TM-EV-209)',
    offersCount: 2,
    bestOfferRate: 80,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-0104',
    buyerName: 'Reliance Retail Ventures Ltd',
    buyerGstin: '27AABCR4589H1Z2',
    supplierAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    supplierName: 'Apex Precision Auto-Components Pvt Ltd',
    faceValue: 2_500_000_000_000n, // Rs 25,00,000
    issueDate: NOW - 5 * DAY,
    dueDate: NOW + 55 * DAY,
    status: 1, // Submitted
    documentHash: '0x3a4b92c481e3a1f1816e107a67303c2a9a463fd3993a649ad9ee6c28b6d80d22',
    invoiceKey: '0x5c72d82939b4b008681289cf7bfca1d563e414194098675a8ea97a9f60bfb374',
    riskScore: 84,
    sector: 'Consumer Goods & Retail',
    description: 'Recyclable corrugated shipping cartons and warehouse pallet packaging.',
    goodsSummary: '45,000 multi-layer kraft containers',
    offersCount: 0,
  },
  {
    id: '3',
    invoiceNumber: 'INV-2026-0042',
    buyerName: 'Larsen & Toubro Construction Ltd',
    buyerGstin: '24AAACL0149C1ZS',
    supplierAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    supplierName: 'Bharat Infrastructure Fab & Foundry',
    faceValue: 5_000_000_000_000n, // Rs 50,00,000
    issueDate: NOW - 30 * DAY,
    dueDate: NOW + 30 * DAY,
    status: 5, // Financed
    documentHash: '0x6a2c1b827e90812984fe732101ab0912cb849182390abdf1928374829101ffbb',
    invoiceKey: '0x8192837465910293847561029384756102938475610293847561029384756102',
    riskScore: 88,
    sector: 'Infrastructure & Urban Rail',
    description: 'Pre-stressed structural steel anchors for Metro Line 3 viaduct support pillars.',
    goodsSummary: '180 MT High-Tensile Steel Fasteners',
    offersCount: 3,
    bestOfferRate: 85,
  },
  {
    id: '4',
    invoiceNumber: 'INV-2026-0019',
    buyerName: 'Infosys BPM Limited',
    buyerGstin: '29AABCI2938J1ZK',
    supplierAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    supplierName: 'Apex Precision Auto-Components Pvt Ltd',
    faceValue: 800_000_000_000n, // Rs 8,00,000
    issueDate: NOW - 65 * DAY,
    dueDate: NOW - 5 * DAY,
    status: 6, // Settled
    documentHash: '0x49f992384a827bcdaef102938561928374650192837465918273645019283746',
    invoiceKey: '0x2299887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbb',
    riskScore: 96,
    sector: 'Information Technology',
    description: 'Annual network infrastructure cabling and datacenter rack cooling maintenance.',
    goodsSummary: 'Milestone 4 Delivery - Network Operations Center',
    offersCount: 1,
    bestOfferRate: 90,
  },
  {
    id: '5',
    invoiceNumber: 'INV-2026-0112',
    buyerName: 'Maruti Suzuki India Limited',
    buyerGstin: '06AAACM4928L1ZU',
    supplierAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    supplierName: 'Bharat Infrastructure Fab & Foundry',
    faceValue: 1_500_000_000_000n, // Rs 15,00,000
    issueDate: NOW - 2 * DAY,
    dueDate: NOW + 58 * DAY,
    status: 4, // Flagged
    documentHash: '0x9928374650192837465918273645019283746501928374659182736450192837',
    invoiceKey: '0x1029384756102938475610293847561029384756102938475610293847561029',
    riskScore: 48,
    sector: 'Automotive OEM',
    description: 'Suspension coil springs and strut mountings.',
    goodsSummary: 'Discrepancy detected between E-Way bill weight (4,200kg) and PO weight (3,500kg).',
    offersCount: 0,
  },
]

export const INITIAL_DEMO_OFFERS: DemoOffer[] = [
  {
    id: '1',
    invoiceId: '1',
    financierAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    financierName: 'Falcon Trade Capital NBFC',
    principal: 800_000_000_000n, // Rs 8,00,000 (80% advance)
    fee: 40_000_000_000n, // Rs 40,000 (5% discount fee)
    advanceRateBps: 8000,
    validitySeconds: 7 * DAY,
    expiryTimestamp: NOW + 5 * DAY,
    status: 1, // Open
    impliedApr: 30.41,
  },
  {
    id: '2',
    invoiceId: '1',
    financierAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    financierName: 'Kuber Liquid FinTech LLP',
    principal: 850_000_000_000n, // Rs 8,50,000 (85% advance)
    fee: 46_750_000_000n, // Rs 46,750
    advanceRateBps: 8500,
    validitySeconds: 5 * DAY,
    expiryTimestamp: NOW + 3 * DAY,
    status: 1, // Open
    impliedApr: 33.46,
  },
  {
    id: '3',
    invoiceId: '3',
    financierAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    financierName: 'Falcon Trade Capital NBFC',
    principal: 4_000_000_000_000n, // Rs 40,00,000 (80%)
    fee: 180_000_000_000n, // Rs 1,80,000
    advanceRateBps: 8000,
    validitySeconds: 7 * DAY,
    expiryTimestamp: NOW - 20 * DAY,
    status: 2, // Accepted
    impliedApr: 27.38,
  },
]

export const INITIAL_DEMO_FINANCINGS: DemoFinancing[] = [
  {
    id: '1',
    invoiceId: '3',
    offerId: '3',
    supplierAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    financierAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    principal: 4_000_000_000_000n, // Rs 40,00,000
    fee: 180_000_000_000n, // Rs 1,80,000
    serviceFee: 20_000_000_000n, // Rs 20,000 (0.5%)
    totalDue: 4_180_000_000_000n, // Rs 41,80,000
    fundedAt: NOW - 20 * DAY,
    maturity: NOW + 30 * DAY,
    status: 1, // Active
  },
]
