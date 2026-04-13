import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-middleware';
import { createAuditLog, PrismaInstance } from '@/lib/audit';
import { generateInvoicePDF } from '@/lib/pdf/invoice';
import { Variant, Product } from '@prisma/client';

async function generateInvoiceNumber(tx: PrismaInstance, date: Date): Promise<string> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await tx.invoice.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  const nextNumber = count + 1;
  const sequence = String(nextNumber).padStart(5, '0');
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `F-${yyyy}${mm}${dd}-${sequence}`;
}

const saleLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().gt(0),
});

const postSaleSchema = z.object({
  lines: z.array(saleLineSchema).min(1, "La venta debe tener al menos una línea"),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const parsed = postSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "La venta debe tener al menos una línea" }, { status: 400 });
    }

    const { lines } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    let transactionResult;
    try {
      transactionResult = await prisma.$transaction(async (tx: PrismaInstance) => {
        const uniqueVariantIds = Array.from(new Set(lines.map(l => l.variantId))).sort();

        const lockedVariants: (Variant & { product: Product })[] = [];

        for (const vId of uniqueVariantIds) {
          // Native retrieval, Prisma handles isolation in explicit transaction

          
          const variant = await tx.variant.findUnique({
            where: { id: vId },
            include: { product: true }
          });

          // 2. Verified existence/active
          if (!variant || !variant.active) {
            throw { type: 'NOT_FOUND', id: vId };
          }
          
          // 3. Verify parent product active
          if (!variant.product.active) {
            throw { type: 'PRODUCT_INACTIVE', name: variant.name };
          }

          lockedVariants.push(variant);
        }

        // 4 & 5. Verify quantities across all lines
        const quantityNeeded: Record<string, number> = {};
        for (const line of lines) {
          quantityNeeded[line.variantId] = (quantityNeeded[line.variantId] || 0) + line.quantity;
        }

        for (const vId of Object.keys(quantityNeeded)) {
          const needed = quantityNeeded[vId];
          const varDb = lockedVariants.find(v => v.id === vId);
          if (varDb && varDb.currentStock < needed) {
            throw { type: 'INSUFFICIENT_STOCK', name: varDb.name };
          }
        }

        // 6. Create Sale
        const newSale = await tx.sale.create({
          data: {
            userId: authUser.userId,
            date: new Date(),
            status: 'ACTIVE'
          }
        });

        // 7, 8, 9. Action lines
        for (const line of lines) {
          const varDb = lockedVariants.find(v => v.id === line.variantId);
          if (!varDb) continue;

          await tx.saleLine.create({
            data: {
              saleId: newSale.id,
              variantId: line.variantId,
              quantity: line.quantity,
              unitPrice: varDb.currentPrice
            }
          });

          await tx.stockMovement.create({
            data: {
              variantId: line.variantId,
              type: 'OUT',
              quantity: line.quantity,
              reason: 'Venta',
              referenceId: newSale.id,
              referenceType: 'SALE',
              userId: authUser.userId
            }
          });

          await tx.variant.update({
            where: { id: line.variantId },
            data: { currentStock: { decrement: line.quantity } }
          });
        }

        // 10. Generate Invoice
        const invoiceLines = lines.map(line => {
          const varDb = lockedVariants.find(v => v.id === line.variantId)!;
          return {
            quantity: line.quantity,
            unitPrice: varDb.currentPrice,
            variant: {
              name: varDb.name,
              product: { name: varDb.product.name }
            }
          };
        });

        const invoiceNumber = await generateInvoiceNumber(tx, newSale.date);
        
        const pdfBytes = await generateInvoicePDF({
          invoiceNumber,
          date: newSale.date,
          userUsername: user.username,
          lines: invoiceLines.map(l => ({
            productName: l.variant.product.name,
            variantName: l.variant.name,
            quantity: l.quantity,
            unitPrice: Number(l.unitPrice)
          }))
        });

        const newInvoice = await tx.invoice.create({
          data: {
            saleId: newSale.id,
            invoiceNumber,
            pdfData: Buffer.from(pdfBytes)
          }
        });

        // Add Audit for Invoice
        await createAuditLog(tx, {
          entity: "Invoice",
          entityId: newInvoice.id,
          action: "CREATE",
          userId: authUser.userId
        });

        return {
          newSale,
          invoiceId: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber
        };
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'type' in e) {
        const err = e as { type: string; id?: string; name?: string };
        if (err.type === 'NOT_FOUND') return NextResponse.json({ error: `La variante ${err.id} no fue encontrada o está inactiva` }, { status: 400 });
        if (err.type === 'PRODUCT_INACTIVE') return NextResponse.json({ error: `El producto de la variante ${err.name} está inactivo` }, { status: 400 });
        if (err.type === 'INSUFFICIENT_STOCK') return NextResponse.json({ error: `Stock insuficiente para ${err.name}` }, { status: 400 });
      }
      console.error("[Sales API Error]:", e);
      let errMsg = "Error interno de servidor o base de datos.";
      if (e instanceof Error) errMsg = e.message;
      else if (typeof e === 'string') errMsg = e;
      return NextResponse.json({ error: `Fallo al procesar: ${errMsg}` }, { status: 409 });
    }

    await createAuditLog(prisma, {
      entity: "Sale",
      entityId: transactionResult.newSale.id,
      action: "CREATE",
      userId: authUser.userId
    });

    const fullSale = await prisma.sale.findUnique({
      where: { id: transactionResult.newSale.id },
      include: { saleLines: true }
    });

    return NextResponse.json({ 
      sale: fullSale, 
      lines: fullSale?.saleLines,
      invoice: {
        id: transactionResult.invoiceId,
        invoiceNumber: transactionResult.invoiceNumber
      }
    }, { status: 201 });

  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const userId = searchParams.get('userId');

    const whereClause: {
      status?: "ACTIVE" | "CANCELLED";
      userId?: string;
      date?: { gte?: Date; lte?: Date };
    } = {};

    if (status === "ACTIVE" || status === "CANCELLED") {
      whereClause.status = status;
    }
    if (userId) {
      whereClause.userId = userId;
    }
    if (dateFrom || dateTo) {
      whereClause.date = {};
      if (dateFrom) whereClause.date.gte = new Date(dateFrom);
      if (dateTo) whereClause.date.lte = new Date(dateTo);
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      include: {
        saleLines: {
          include: {
            variant: { 
              select: { 
                name: true, 
                currentPrice: true,
                product: { select: { name: true } }
              } 
            }
          }
        },
        user: { select: { username: true } },
        cancelledByUser: { select: { username: true } },
        invoice: { select: { id: true, invoiceNumber: true } }
      }
    });

    const mappedSales = sales.map(s => ({ ...s, lines: s.saleLines }));

    return NextResponse.json({ sales: mappedSales }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Ocurrió un error en el servidor" }, { status: 500 });
  }
}


export const dynamic = 'force-dynamic';
