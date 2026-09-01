import {
  ALIGN_CENTER,
  ALIGN_LEFT,
  BOLD_OFF,
  BOLD_ON,
  CUT_PAPER,
  DOUBLE_SIZE_OFF,
  DOUBLE_SIZE_ON,
  ESC_INIT,
  TALL_SIZE_ON,
  decorativeBorder,
  divider,
  formatMoney,
  rightAlignedLine
} from "./ejemplo.escpos";
import { EjemploSale, PAYMENT_METHOD_LABELS } from "../ejemplo.types";

// Placeholder de marca: es una demo para mostrarle a clientes, no un
// negocio puntual (ver ejemplo-ticket viejo en HTML que esto reemplaza).
const STORE_NAME = "SU LOGO";
const INTERNAL_USE_NOTE = "Uso interno";
const FOOTER_MESSAGE = "Gracias por tu compra!";

// Arma las lineas ESC/POS de un ticket de venta. sales son las ventas
// individuales que devolvio el backend (una por producto del carrito);
// se juntan en un unico ticket con su total.
export function buildSaleTicketLines(sales: EjemploSale[], clientName?: string) {
  const lines: string[] = [];
  if (!sales.length) return lines;

  const first = sales[0];
  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  lines.push(ESC_INIT);
  lines.push(ALIGN_CENTER);
  lines.push(BOLD_ON, DOUBLE_SIZE_ON);
  lines.push(`${STORE_NAME}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push(`${new Date(first.createdAt).toLocaleString("es-UY", { timeZone: "America/Montevideo" })}\n`);
  lines.push(`${INTERNAL_USE_NOTE}\n`);

  lines.push(ALIGN_LEFT);
  lines.push(`${decorativeBorder()}\n`);
  lines.push(BOLD_ON, TALL_SIZE_ON);
  const trimmedClientName = clientName?.trim();
  if (trimmedClientName) {
    lines.push(`Cliente: ${trimmedClientName}\n`);
  }
  lines.push(`Pago: ${PAYMENT_METHOD_LABELS[first.paymentMethod]}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push(`${decorativeBorder()}\n`);

  sales.forEach((sale, index) => {
    lines.push(BOLD_ON);
    lines.push(`${rightAlignedLine(`${sale.quantity}x ${sale.productName} `, formatMoney(sale.total))}\n`);
    lines.push(BOLD_OFF);
    if (sale.detail?.trim()) {
      lines.push(`  ${sale.detail.trim()}\n`);
    }
    if (index < sales.length - 1) {
      lines.push(`${divider()}\n`);
    }
  });

  lines.push(`${decorativeBorder()}\n`);
  lines.push(BOLD_ON, TALL_SIZE_ON);
  lines.push(`${rightAlignedLine("Total ", formatMoney(total))}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push("\n");

  lines.push(ALIGN_CENTER);
  lines.push(BOLD_ON, TALL_SIZE_ON);
  lines.push(`${FOOTER_MESSAGE}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);

  lines.push("\n\n\n");
  lines.push(ALIGN_LEFT);
  lines.push(CUT_PAPER);

  return lines;
}
