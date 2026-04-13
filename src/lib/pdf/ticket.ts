import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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

export async function generateTicketPDF(params: {
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

  // Reduced width specifically to avoid overflow on narrow mobile screens
  const width = 240;
  const margin = 15;
  
  // Calculate dynamic height based on lines
  const headerHeight = 100;
  const lineItemHeight = 25;
  const footerHeight = 80;
  const height = headerHeight + (lines.length * lineItemHeight) + footerHeight;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);
  
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  const black = rgb(0, 0, 0);

  let currentY = height - margin;

  // Title centered
  const storeName = 'SISTEMA DE VENTAS';
  page.drawText(storeName, {
    x: (width - helveticaBold.widthOfTextAtSize(storeName, 12)) / 2,
    y: currentY - 12,
    size: 12,
    font: helveticaBold,
    color: black,
  });

  currentY -= 25;

  const ticketTitle = 'TICKET DE COMPRA';
  page.drawText(ticketTitle, {
    x: (width - helveticaBold.widthOfTextAtSize(ticketTitle, 10)) / 2,
    y: currentY,
    size: 10,
    font: helveticaBold,
    color: black,
  });

  currentY -= 15;

  page.drawText(`Nro: ${invoiceNumber}`, { x: margin, y: currentY, size: 8, font: helveticaFont, color: black });
  currentY -= 10;
  page.drawText(`Fecha: ${formatDate(date)}`, { x: margin, y: currentY, size: 8, font: helveticaFont, color: black });
  currentY -= 10;
  page.drawText(`Cajero: ${userUsername}`, { x: margin, y: currentY, size: 8, font: helveticaFont, color: black });

  currentY -= 10;
  page.drawLine({ start: { x: margin, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 1, color: black });
  currentY -= 12;

  let totalAmount = 0;

  for (const line of lines) {
    const subtotal = line.quantity * line.unitPrice;
    totalAmount += subtotal;

    const itemName = `${line.productName} - ${line.variantName}`;
    const truncated = itemName.length > 28 ? itemName.substring(0, 25) + "..." : itemName;

    page.drawText(truncated, { x: margin, y: currentY, size: 8, font: helveticaBold, color: black });
    currentY -= 10;

    const details = `${line.quantity} un x ${formatCurrency(line.unitPrice)}`;
    page.drawText(details, { x: margin, y: currentY, size: 8, font: helveticaFont, color: black });
    
    const subtotalStr = formatCurrency(subtotal);
    page.drawText(subtotalStr, { x: width - margin - helveticaFont.widthOfTextAtSize(subtotalStr, 8), y: currentY, size: 8, font: helveticaFont, color: black });

    currentY -= 10;
  }

  currentY -= 5;
  page.drawLine({ start: { x: margin, y: currentY }, end: { x: width - margin, y: currentY }, thickness: 1, color: black });
  currentY -= 15;

  const totalLabel = 'TOTAL:';
  page.drawText(totalLabel, { x: margin, y: currentY, size: 12, font: helveticaBold, color: black });
  
  const totalStr = formatCurrency(totalAmount);
  page.drawText(totalStr, { x: width - margin - helveticaBold.widthOfTextAtSize(totalStr, 12), y: currentY, size: 12, font: helveticaBold, color: black });

  currentY -= 20;

  const thankYou = '¡Gracias por su compra!';
  page.drawText(thankYou, {
    x: (width - helveticaOblique.widthOfTextAtSize(thankYou, 9)) / 2,
    y: currentY,
    size: 9,
    font: helveticaOblique,
    color: black,
  });

  return await pdfDoc.save();
}
