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

// copies: cuantas veces se repite el ticket en el mismo trabajo de
// impresion (mismo criterio que joker). Con 1 sale solo el ticket
// completo (para el cliente, con precios). Con 3 salen ademas dos copias
// compactas sin precios -- una titulada "COMANDA" (para cocina/mostrador)
// y otra "ARCHIVO" (para que quede en el local) -- cada una con su propio
// corte de papel. Con 0 no se imprime nada.
export function buildSaleTicketLines(sales: EjemploSale[], clientName: string | undefined, copies: 0 | 1 | 3 = 1) {
  if (!sales.length || copies === 0) return [];

  const lines = buildFullTicketLines(sales, clientName);

  if (copies === 3) {
    lines.push(...buildCompactTicketLines(sales, "COMANDA"));
    lines.push(...buildCompactTicketLines(sales, "ARCHIVO"));
  }

  return lines;
}

function buildFullTicketLines(sales: EjemploSale[], clientName?: string) {
  const lines: string[] = [];

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

// Version compacta sin precios (comanda/archivo): solo lo que hace falta
// para preparar/registrar el pedido, en letra grande para leerse rapido
// de lejos.
function buildCompactTicketLines(sales: EjemploSale[], heading: "COMANDA" | "ARCHIVO") {
  const lines: string[] = [];
  const first = sales[0];

  lines.push(ESC_INIT);
  lines.push(ALIGN_CENTER);
  lines.push(BOLD_ON, DOUBLE_SIZE_ON);
  lines.push(`${heading}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push(`Venta #${first.id}\n`);
  lines.push(`${new Date(first.createdAt).toLocaleTimeString("es-UY", { timeZone: "America/Montevideo" })}\n`);

  lines.push(ALIGN_LEFT);
  lines.push(`${decorativeBorder()}\n`);

  sales.forEach((sale, index) => {
    lines.push(BOLD_ON, DOUBLE_SIZE_ON);
    lines.push(`${sale.quantity}x ${sale.productName}\n`);
    lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
    if (sale.detail?.trim()) {
      lines.push(`${sale.detail.trim()}\n`);
    }
    if (index < sales.length - 1) {
      lines.push(`${decorativeBorder()}\n`);
    }
  });

  lines.push(`${decorativeBorder()}\n`);
  lines.push("\n\n\n");
  lines.push(CUT_PAPER);

  return lines;
}
