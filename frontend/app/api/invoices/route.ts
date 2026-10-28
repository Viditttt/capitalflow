import { NextResponse } from 'next/server'
import { INITIAL_DEMO_INVOICES } from '@/lib/demo-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const statusParam = searchParams.get('status')
  const sectorParam = searchParams.get('sector')

  let invoices = [...INITIAL_DEMO_INVOICES]

  if (statusParam && statusParam !== 'all') {
    const statusNum = parseInt(statusParam, 10)
    invoices = invoices.filter((i) => i.status === statusNum)
  }

  if (sectorParam && sectorParam !== 'all') {
    invoices = invoices.filter((i) => i.sector === sectorParam)
  }

  // Convert BigInt to string for JSON serialization
  const serialized = invoices.map((inv) => ({
    ...inv,
    faceValue: inv.faceValue.toString(),
  }))

  return NextResponse.json({
    success: true,
    count: serialized.length,
    data: serialized,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { invoiceNumber, buyerName, buyerGstin, faceValue, dueDate, sector, description, goodsSummary } = body

    if (!invoiceNumber || !buyerName || !faceValue) {
      return NextResponse.json(
        { success: false, error: 'Missing required invoice parameters' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice registered successfully in off-chain database projection',
      data: {
        id: String(Date.now()),
        invoiceNumber,
        buyerName,
        buyerGstin,
        status: 1, // Submitted
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
