import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function generateSalesExport(filters: { dateFrom?: string; dateTo?: string; userId?: string; productId?: string }) {
  const where: { date?: { gte?: Date; lte?: Date }; userId?: string; lines?: { some: { variant: { productId: string } } } } = {};
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
  }
  if (filters.userId) where.userId = filters.userId;
  if (filters.productId) {
    where.lines = { some: { variant: { productId: filters.productId } } };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      user: true,
      lines: { include: { variant: { include: { product: true } } } }
    },
    orderBy: { date: 'desc' },
    take: 10000
  });

  const rows: Record<string, string | number>[] = [];
  sales.forEach(sale => {
    sale.lines.forEach(line => {
      rows.push({
        'ID Venta': sale.id,
        'Fecha': sale.date.toISOString(),
        'Estado': sale.status,
        'Usuario': sale.user.username,
        'Variante': line.variant.name,
        'Producto': line.variant.product.name,
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
    'Variante': v.name,
    'Producto': v.product.name,
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

  const rows = movements.map(m => ({
    'ID': m.id,
    'Fecha': m.createdAt.toISOString(),
    'Tipo': m.type,
    'Variante': m.variant.name,
    'Producto': m.variant.product.name,
    'Cantidad': m.quantity,
    'Motivo': m.reason || '',
    'Usuario': m.user.username
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
