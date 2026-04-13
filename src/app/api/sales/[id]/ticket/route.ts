import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { generateTicketPDF } from '@/lib/pdf/ticket';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const id = params.id;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        invoice: true,
        user: true,
        saleLines: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    if (!sale.invoice) {
      return NextResponse.json({ error: "Factura no encontrada (Imposible emitir ticket)" }, { status: 404 });
    }

    const ticketBytes = await generateTicketPDF({
      invoiceNumber: sale.invoice.invoiceNumber,
      date: sale.date,
      userUsername: sale.user.username,
      lines: sale.saleLines.map(line => ({
        productName: line.variant.product.name,
        variantName: line.variant.name,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice)
      }))
    });

    const pdfBuffer = Buffer.from(ticketBytes);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ticket-${sale.invoice.invoiceNumber}.pdf"`
      }
    });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}
