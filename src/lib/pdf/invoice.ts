import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PrismaInstance } from '@/lib/audit';

export async function generateInvoiceNumber(tx: PrismaInstance, date: Date): Promise<string> {
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

const formatCurrency = (amount: number) => {
  return "$" + amount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date: Date) => {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

export async function generateInvoicePDF(params: {
  invoiceNumber: string;
  date: Date;
  userUsername: string;
  lines: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
  }>;
}): Promise<Uint8Array> {
  const { invoiceNumber, date, userUsername, lines } = params;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  const margin = 40;
  
  // Colors
  const black = rgb(0, 0, 0);
  const grayDark = rgb(107/255, 114/255, 128/255); // #6B7280
  const grayLight = rgb(243/255, 244/255, 246/255); // #F3F4F6
  const grayAlt = rgb(250/255, 250/255, 250/255); // #FAFAFA
  
  let currentY = height - margin;

  // Header Left
  page.drawText('SISTEMA DE VENTAS', {
    x: margin,
    y: currentY - 14,
    size: 18,
    font: helveticaBold,
    color: black,
  });

  // Header Right
  const dateStr = formatDate(date);
  page.drawText('FACTURA', {
    x: width - margin - helveticaBold.widthOfTextAtSize('FACTURA', 14),
    y: currentY - 14,
    size: 14,
    font: helveticaBold,
    color: black,
  });
  
  page.drawText(invoiceNumber, {
    x: width - margin - helveticaFont.widthOfTextAtSize(invoiceNumber, 11),
    y: currentY - 30,
    size: 11,
    font: helveticaFont,
    color: black,
  });
  
  page.drawText(dateStr, {
    x: width - margin - helveticaFont.widthOfTextAtSize(dateStr, 10),
    y: currentY - 44,
    size: 10,
    font: helveticaFont,
    color: black,
  });

  currentY -= 60;
  
  // Header separator
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: width - margin, y: currentY },
    thickness: 1,
    color: grayDark,
  });
  
  currentY -= 20;

  // Vendido por
  const vendorLabel = 'Vendido por: ';
  page.drawText(vendorLabel, {
    x: margin,
    y: currentY,
    size: 9,
    font: helveticaFont,
    color: grayDark,
  });
  page.drawText(userUsername, {
    x: margin + helveticaFont.widthOfTextAtSize(vendorLabel, 9),
    y: currentY,
    size: 9,
    font: helveticaFont,
    color: black,
  });

  currentY -= 30;

  // Table header
  page.drawRectangle({
    x: margin,
    y: currentY - 15,
    width: width - margin * 2,
    height: 25,
    color: grayLight,
  });
  
  const col1X = margin + 10;
  const col2X = margin + 280;
  const col3X = margin + 350;
  const col4X = margin + 430;

  page.drawText('Producto / Variante', { x: col1X, y: currentY - 5, size: 9, font: helveticaBold, color: black });
  page.drawText('Cant.', { x: col2X, y: currentY - 5, size: 9, font: helveticaBold, color: black });
  page.drawText('Precio Unit.', { x: col3X, y: currentY - 5, size: 9, font: helveticaBold, color: black });
  page.drawText('Subtotal', { x: col4X, y: currentY - 5, size: 9, font: helveticaBold, color: black });

  currentY -= 15;

  // Table rows
  let subtotalGeneral = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const subtotal = line.quantity * line.unitPrice;
    subtotalGeneral += subtotal;

    // Background alternated
    const isEven = i % 2 === 0;
    const bgFill = isEven ? rgb(1, 1, 1) : grayAlt;
    
    currentY -= 25;
    page.drawRectangle({
      x: margin,
      y: currentY - 5,
      width: width - margin * 2,
      height: 25,
      color: bgFill,
    });

    const productNameCombined = `${line.productName} — ${line.variantName}`;
    const truncated = productNameCombined.length > 50 ? productNameCombined.substring(0, 47) + "..." : productNameCombined;

    page.drawText(truncated, { x: col1X, y: currentY + 5, size: 9, font: helveticaFont, color: black });
    page.drawText(String(line.quantity), { x: col2X, y: currentY + 5, size: 9, font: helveticaFont, color: black });
    page.drawText(formatCurrency(line.unitPrice), { x: col3X, y: currentY + 5, size: 9, font: helveticaFont, color: black });
    page.drawText(formatCurrency(subtotal), { x: col4X, y: currentY + 5, size: 9, font: helveticaFont, color: black });

    // Thin separator line between rows
    page.drawLine({
      start: { x: margin, y: currentY - 5 },
      end: { x: width - margin, y: currentY - 5 },
      thickness: 0.5,
      color: rgb(229/255, 231/255, 235/255),
    });
  }

  currentY -= 30;

  // Totals Section
  const totalsBaseX = width - margin - 150;
  
  page.drawText('Subtotal:', {
    x: totalsBaseX,
    y: currentY,
    size: 11,
    font: helveticaFont,
    color: black,
  });
  page.drawText(formatCurrency(subtotalGeneral), {
    x: width - margin - helveticaFont.widthOfTextAtSize(formatCurrency(subtotalGeneral), 11),
    y: currentY,
    size: 11,
    font: helveticaFont,
    color: black,
  });

  currentY -= 20;

  page.drawText('Total:', {
    x: totalsBaseX,
    y: currentY,
    size: 11,
    font: helveticaBold,
    color: black,
  });
  page.drawText(formatCurrency(subtotalGeneral), {
    x: width - margin - helveticaBold.widthOfTextAtSize(formatCurrency(subtotalGeneral), 11),
    y: currentY,
    size: 11,
    font: helveticaBold,
    color: black,
  });

  // Footer
  const footerY = margin;
  page.drawLine({
    start: { x: margin, y: footerY + 20 },
    end: { x: width - margin, y: footerY + 20 },
    thickness: 1,
    color: grayDark,
  });

  const now = new Date();
  const footerText = `Documento generado automáticamente — ${formatDate(now)}`;
  
  page.drawText(footerText, {
    x: (width - helveticaFont.widthOfTextAtSize(footerText, 8)) / 2,
    y: footerY,
    size: 8,
    font: helveticaFont,
    color: grayDark,
  });

  return await pdfDoc.save();
}
