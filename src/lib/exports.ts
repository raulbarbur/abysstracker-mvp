import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function generateSalesExport(filters: { dateFrom?: string; dateTo?: string; userId?: string; productId?: string }) {
  const where: { date?: { gte?: Date; lte?: Date }; userId?: string; saleLines?: { some: { variant: { productId: string } } } } = {};
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
  }
  if (filters.userId) where.userId = filters.userId;
  if (filters.productId) {
    where.saleLines = { some: { variant: { productId: filters.productId } } };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      user: true,
      invoice: true,
      saleLines: { include: { variant: { include: { product: true } } } }
    },
    orderBy: { date: 'desc' },
    take: 10000
  });

  const formatDate = (d: Date) => new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);

  const rows: Record<string, string | number>[] = [];
  sales.forEach(sale => {
    sale.saleLines.forEach(line => {
      rows.push({
        'Comprobante': sale.invoice?.invoiceNumber || 'S/N',
        'Fecha': formatDate(sale.date),
        'Estado': sale.status === 'ACTIVE' ? 'Activa' : 'Anulada',
        'Pago': sale.paymentMethod === 'CASH' ? 'Efectivo' : sale.paymentMethod === 'TRANSFER' ? 'Transferencia' : '',
        'Usuario': sale.user.username,
        'Producto': line.variant.product.name,
        'Variante': line.variant.name,
        'Cantidad': line.quantity,
        'Precio Unitario': Number(line.unitPrice),
        'Subtotal': Number(line.unitPrice) * line.quantity
      });
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function generateStockExport(filters: { productId?: string }) {
  const where: { active: boolean; productId?: string } = { active: true };
  if (filters.productId) {
    where.productId = filters.productId;
  }

  const variants = await prisma.variant.findMany({
    where,
    include: { product: true }
  });

  const rows = variants.map(v => ({
    'Producto': v.product.name,
    'Variante': v.name,
    'Stock Actual': v.currentStock,
    'Stock Mínimo': v.minimumStock,
    'Activo': v.active ? 'Sí' : 'No'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export async function generateMovementsExport(filters: { dateFrom?: string; dateTo?: string; userId?: string; productId?: string }) {
  const where: { createdAt?: { gte?: Date; lte?: Date }; userId?: string; variant?: { productId: string } } = {};
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }
  if (filters.userId) where.userId = filters.userId;
  if (filters.productId) {
    where.variant = { productId: filters.productId };
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      user: true,
      variant: { include: { product: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10000
  });

  const formatDate = (d: Date) => new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(d);

  const getMovementLabel = (type: string, referenceType: string | null) => {
    if (type === 'OUT' && referenceType === 'SALE') return 'Venta';
    if (type === 'IN' && referenceType === 'SALE_CANCELLATION') return 'Reposición por anulación';
    const labels: Record<string, string> = { IN: 'Entrada', OUT: 'Salida', ADJUSTMENT: 'Ajuste', LOSS: 'Pérdida' };
    return labels[type] || type;
  };

  const rows = movements.map(m => ({
    'Fecha': formatDate(m.createdAt),
    'Tipo': getMovementLabel(m.type, m.referenceType ?? null),
    'Cantidad': m.quantity,
    'Producto': m.variant.product.name,
    'Variante': m.variant.name,
    'Motivo': m.reason || '',
    'Usuario': m.user.username
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
