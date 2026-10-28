'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { registryContract, marketplaceContract, tokenContract, HARDHAT_ACCOUNTS, CONTRACT_ADDRESSES } from '@/lib/constants'
import { INITIAL_DEMO_INVOICES, INITIAL_DEMO_OFFERS, INITIAL_DEMO_FINANCINGS, DemoInvoice, DemoOffer, DemoFinancing } from '@/lib/demo-data'
import { hashString } from '@/lib/utils'

const STORAGE_KEYS = {
  INVOICES: 'cf_invoices_v1',
  OFFERS: 'cf_offers_v1',
  FINANCINGS: 'cf_financings_v1',
}

export function useCapitalFlow() {
  const { address, isConnected } = useAccount()
  const [invoices, setInvoices] = useState<DemoInvoice[]>(INITIAL_DEMO_INVOICES)
  const [offers, setOffers] = useState<DemoOffer[]>(INITIAL_DEMO_OFFERS)
  const [financings, setFinancings] = useState<DemoFinancing[]>(INITIAL_DEMO_FINANCINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES)
      const storedOffers = localStorage.getItem(STORAGE_KEYS.OFFERS)
      const storedFinancings = localStorage.getItem(STORAGE_KEYS.FINANCINGS)

      if (storedInvoices) {
        const parsed = JSON.parse(storedInvoices)
        // Convert bigint fields
        setInvoices(parsed.map((inv: any) => ({ ...inv, faceValue: BigInt(inv.faceValue) })))
      }
      if (storedOffers) {
        const parsed = JSON.parse(storedOffers)
        setOffers(parsed.map((off: any) => ({
          ...off,
          principal: BigInt(off.principal),
          fee: BigInt(off.fee),
        })))
      }
      if (storedFinancings) {
        const parsed = JSON.parse(storedFinancings)
        setFinancings(parsed.map((fin: any) => ({
          ...fin,
          principal: BigInt(fin.principal),
          fee: BigInt(fin.fee),
          serviceFee: BigInt(fin.serviceFee),
          totalDue: BigInt(fin.totalDue),
        })))
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persist helper
  const saveState = useCallback((newInvoices?: DemoInvoice[], newOffers?: DemoOffer[], newFinancings?: DemoFinancing[]) => {
    try {
      if (newInvoices) {
        setInvoices(newInvoices)
        const serializable = newInvoices.map(inv => ({ ...inv, faceValue: inv.faceValue.toString() }))
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(serializable))
      }
      if (newOffers) {
        setOffers(newOffers)
        const serializable = newOffers.map(off => ({
          ...off,
          principal: off.principal.toString(),
          fee: off.fee.toString(),
        }))
        localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(serializable))
      }
      if (newFinancings) {
        setFinancings(newFinancings)
        const serializable = newFinancings.map(fin => ({
          ...fin,
          principal: fin.principal.toString(),
          fee: fin.fee.toString(),
          serviceFee: fin.serviceFee.toString(),
          totalDue: fin.totalDue.toString(),
        }))
        localStorage.setItem(STORAGE_KEYS.FINANCINGS, JSON.stringify(serializable))
      }
    } catch (e) {
      console.warn('Could not persist to localStorage:', e)
    }
  }, [])

  // Wagmi contracts integration
  const { writeContractAsync } = useWriteContract()

  // 1. Register Invoice
  const registerInvoice = async (params: {
    invoiceNumber: string
    buyerName: string
    buyerGstin: string
    supplierName: string
    faceValue: bigint
    issueDate: number
    dueDate: number
    sector: string
    description: string
    goodsSummary: string
  }) => {
    const rawDocumentString = `${params.invoiceNumber}|${params.buyerGstin}|${params.faceValue}|${params.dueDate}`
    const documentHash = await hashString(rawDocumentString)
    const invoiceKey = await hashString(`${params.invoiceNumber}|${Date.now()}`)

    let txHash: string | undefined

    if (isConnected && CONTRACT_ADDRESSES.InvoiceRegistry !== '0x0') {
      try {
        txHash = await writeContractAsync({
          ...registryContract,
          functionName: 'registerInvoice',
          args: [
            invoiceKey as `0x${string}`,
            params.faceValue,
            BigInt(params.issueDate),
            BigInt(params.dueDate),
            documentHash as `0x${string}`,
          ],
        })
      } catch (err) {
        console.warn('On-chain registration failed or skipped, saving in demo store:', err)
      }
    }

    const newId = String(invoices.length + 1)
    const newInvoice: DemoInvoice = {
      id: newId,
      invoiceNumber: params.invoiceNumber,
      buyerName: params.buyerName,
      buyerGstin: params.buyerGstin,
      supplierAddress: address || HARDHAT_ACCOUNTS.supplier1,
      supplierName: params.supplierName,
      faceValue: params.faceValue,
      issueDate: params.issueDate,
      dueDate: params.dueDate,
      status: 1, // Submitted
      documentHash,
      invoiceKey,
      riskScore: Math.floor(Math.random() * 20) + 75, // 75-95
      sector: params.sector,
      description: params.description,
      goodsSummary: params.goodsSummary,
      offersCount: 0,
    }

    const updated = [newInvoice, ...invoices]
    saveState(updated)
    return { invoice: newInvoice, txHash }
  }

  // 2. Verify Invoice
  const verifyInvoice = async (invoiceId: string) => {
    if (isConnected && CONTRACT_ADDRESSES.InvoiceRegistry !== '0x0') {
      try {
        await writeContractAsync({
          ...registryContract,
          functionName: 'verifyInvoice',
          args: [BigInt(invoiceId)],
        })
      } catch (err) {
        console.warn('On-chain verify skipped/failed:', err)
      }
    }

    const updated = invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 2 } : inv
    )
    saveState(updated)
  }

  // 3. Flag Invoice
  const flagInvoice = async (invoiceId: string, reason: string) => {
    const reasonHash = await hashString(reason)
    if (isConnected && CONTRACT_ADDRESSES.InvoiceRegistry !== '0x0') {
      try {
        await writeContractAsync({
          ...registryContract,
          functionName: 'flagInvoice',
          args: [BigInt(invoiceId), reasonHash as `0x${string}`],
        })
      } catch (err) {
        console.warn('On-chain flag skipped/failed:', err)
      }
    }

    const updated = invoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 4 } : inv
    )
    saveState(updated)
  }

  // 4. Submit Offer
  const submitOffer = async (params: {
    invoiceId: string
    principal: bigint
    fee: bigint
    advanceRateBps: number
    validitySeconds: number
    impliedApr: number
  }) => {
    if (isConnected && CONTRACT_ADDRESSES.FinancingMarketplace !== '0x0') {
      try {
        // First approve marketplace for principal
        await writeContractAsync({
          ...tokenContract,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.FinancingMarketplace, params.principal],
        })
        // Submit offer escrow
        await writeContractAsync({
          ...marketplaceContract,
          functionName: 'submitOffer',
          args: [
            BigInt(params.invoiceId),
            params.principal,
            params.fee,
            BigInt(params.validitySeconds),
          ],
        })
      } catch (err) {
        console.warn('On-chain submit offer skipped/failed:', err)
      }
    }

    const newOfferId = String(offers.length + 1)
    const newOffer: DemoOffer = {
      id: newOfferId,
      invoiceId: params.invoiceId,
      financierAddress: address || HARDHAT_ACCOUNTS.financier1,
      financierName: 'Falcon Trade Capital NBFC',
      principal: params.principal,
      fee: params.fee,
      advanceRateBps: params.advanceRateBps,
      validitySeconds: params.validitySeconds,
      expiryTimestamp: Math.floor(Date.now() / 1000) + params.validitySeconds,
      status: 1, // Open
      impliedApr: params.impliedApr,
    }

    const updatedOffers = [newOffer, ...offers]
    const updatedInvoices = invoices.map(inv =>
      inv.id === params.invoiceId
        ? {
            ...inv,
            offersCount: (inv.offersCount || 0) + 1,
            bestOfferRate: Math.max(inv.bestOfferRate || 0, Math.round(params.advanceRateBps / 100)),
          }
        : inv
    )

    saveState(updatedInvoices, updatedOffers)
    return newOffer
  }

  // 5. Accept Offer
  const acceptOffer = async (offerId: string) => {
    const offer = offers.find(o => o.id === offerId)
    if (!offer) return

    if (isConnected && CONTRACT_ADDRESSES.FinancingMarketplace !== '0x0') {
      try {
        await writeContractAsync({
          ...marketplaceContract,
          functionName: 'acceptOffer',
          args: [BigInt(offerId)],
        })
      } catch (err) {
        console.warn('On-chain accept offer skipped/failed:', err)
      }
    }

    const serviceFee = (offer.principal * 50n) / 10000n // 0.50% service fee
    const totalDue = offer.principal + offer.fee

    const newFinancing: DemoFinancing = {
      id: String(financings.length + 1),
      invoiceId: offer.invoiceId,
      offerId: offer.id,
      supplierAddress: address || HARDHAT_ACCOUNTS.supplier1,
      financierAddress: offer.financierAddress,
      principal: offer.principal,
      fee: offer.fee,
      serviceFee,
      totalDue,
      fundedAt: Math.floor(Date.now() / 1000),
      maturity: Math.floor(Date.now() / 1000) + 60 * 86400,
      status: 1, // Active
    }

    const updatedOffers = offers.map(o =>
      o.id === offerId ? { ...o, status: 2 } : o.invoiceId === offer.invoiceId ? { ...o, status: 5 } : o
    )
    const updatedInvoices = invoices.map(inv =>
      inv.id === offer.invoiceId ? { ...inv, status: 5 } : inv
    )
    const updatedFinancings = [newFinancing, ...financings]

    saveState(updatedInvoices, updatedOffers, updatedFinancings)
  }

  // 6. Repay / Settle
  const repayFinancing = async (offerId: string) => {
    const fin = financings.find(f => f.offerId === offerId)
    if (!fin) return

    if (isConnected && CONTRACT_ADDRESSES.FinancingMarketplace !== '0x0') {
      try {
        await writeContractAsync({
          ...tokenContract,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.FinancingMarketplace, fin.totalDue],
        })
        await writeContractAsync({
          ...marketplaceContract,
          functionName: 'repay',
          args: [BigInt(offerId), fin.totalDue],
        })
      } catch (err) {
        console.warn('On-chain repay skipped/failed:', err)
      }
    }

    const updatedFinancings = financings.map(f =>
      f.offerId === offerId ? { ...f, status: 2, settledAt: Math.floor(Date.now() / 1000) } : f
    )
    const updatedInvoices = invoices.map(inv =>
      inv.id === fin.invoiceId ? { ...inv, status: 6 } : inv
    )

    saveState(updatedInvoices, undefined, updatedFinancings)
  }

  // 7. Reset to initial clean state
  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.INVOICES)
    localStorage.removeItem(STORAGE_KEYS.OFFERS)
    localStorage.removeItem(STORAGE_KEYS.FINANCINGS)
    setInvoices(INITIAL_DEMO_INVOICES)
    setOffers(INITIAL_DEMO_OFFERS)
    setFinancings(INITIAL_DEMO_FINANCINGS)
  }

  return {
    invoices,
    offers,
    financings,
    isLoaded,
    registerInvoice,
    verifyInvoice,
    flagInvoice,
    submitOffer,
    acceptOffer,
    repayFinancing,
    resetDemoData,
  }
}
