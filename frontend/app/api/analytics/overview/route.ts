import { NextResponse } from 'next/server'
import { INITIAL_DEMO_INVOICES, INITIAL_DEMO_OFFERS, INITIAL_DEMO_FINANCINGS } from '@/lib/demo-data'

export async function GET() {
  const totalInvoiced = INITIAL_DEMO_INVOICES.reduce((acc, curr) => acc + curr.faceValue, 0n)
  const totalCapitalDeployed = INITIAL_DEMO_FINANCINGS.reduce((acc, curr) => acc + curr.principal, 0n)
  const totalFeesProjected = INITIAL_DEMO_FINANCINGS.reduce((acc, curr) => acc + curr.fee, 0n)

  return NextResponse.json({
    success: true,
    data: {
      totalInvoicedVolume: totalInvoiced.toString(),
      totalCapitalDeployed: totalCapitalDeployed.toString(),
      totalFeesProjected: totalFeesProjected.toString(),
      activeInvoicesCount: INITIAL_DEMO_INVOICES.length,
      activeFinancingsCount: INITIAL_DEMO_FINANCINGS.length,
      averageAprPercent: 28.4,
      defaultRatePercent: 0.0,
      turnaroundHours: 18.5,
    },
  })
}
