import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const id = params.id;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { invoice: true }
    });

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    if (!sale.invoice) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const pdfBuffer = sale.invoice.pdfData;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="factura-${sale.invoice.invoiceNumber}.pdf"`
      }
    });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
