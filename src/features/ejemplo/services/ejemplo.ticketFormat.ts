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
import { MockClient, getMockClientTotal } from "../ejemplo.mockClients";

// Placeholder de marca: es una demo para mostrarle a clientes, no un
// negocio puntual (ver ejemplo-ticket viejo en HTML que esto reemplaza).
const STORE_NAME = "SU LOGO";
const INTERNAL_USE_NOTE = "Uso interno";
const FOOTER_MESSAGE = "Gracias por tu compra!";

// copies: cuantas veces se repite el ticket en el mismo trabajo de
// impresion (mismo criterio que joker). Con 1 sale solo el ticket
// completo (para el cliente, con precios). Con 2 sale ademas la copia
// para "COMANDA" (cocina/mostrador), sin "ARCHIVO" -- es el default
// actual (ticket cliente + comanda, sin que el operario tenga que elegir
// nada). Con 3 sale tambien la copia "ARCHIVO" (para que quede en el
// local), por si en algun momento se vuelve a necesitar. Con 0 no se
// imprime nada.
//
// Las tres copias son el mismo ticket completo (mismos datos: cliente,
// pago, productos con precio, total) -- lo unico que cambia entre una y
// otra es el titulo de arriba ("SU LOGO" para el cliente, "COMANDA" o
// "ARCHIVO" para las otras dos). A proposito, para que las tres se vean
// igual de prolijas -- antes la comanda/archivo era una version distinta,
// sin precios ni datos de pago.
export function buildSaleTicketLines(sales: EjemploSale[], clientName: string | undefined, copies: 0 | 1 | 2 | 3 = 2) {
  if (!sales.length || copies === 0) return [];

  const lines = buildFullTicketLines(sales, clientName);

  if (copies === 2 || copies === 3) {
    lines.push(...buildFullTicketLines(sales, clientName, "COMANDA"));
  }
  if (copies === 3) {
    lines.push(...buildFullTicketLines(sales, clientName, "ARCHIVO"));
  }

  return lines;
}

// Ticket de "Pago" de cuenta cliente (ver ejemplo.mockClients.ts): repasa
// el historial de compras fiadas y el total, y corta -- se usa cuando en
// Clientes se aprieta "Pago" para saldar la cuenta ficticia de prueba.
export function buildAccountSettlementTicketLines(client: MockClient) {
  const lines: string[] = [];
  const total = getMockClientTotal(client);

  lines.push(ESC_INIT);
  lines.push(ALIGN_CENTER);
  lines.push(BOLD_ON, DOUBLE_SIZE_ON);
  lines.push(`${STORE_NAME}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push(`${new Date().toLocaleString("es-UY", { timeZone: "America/Montevideo" })}\n`);
  lines.push("Pago de cuenta\n");

  lines.push(ALIGN_LEFT);
  lines.push(`${decorativeBorder()}\n`);
  lines.push(BOLD_ON, TALL_SIZE_ON);
  lines.push(`Cliente: ${client.name}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push(`${decorativeBorder()}\n`);

  client.purchases.forEach((purchase, index) => {
    lines.push(BOLD_ON);
    lines.push(`${rightAlignedLine(`${purchase.dateLabel} ${purchase.productName} `, formatMoney(purchase.amount))}\n`);
    lines.push(BOLD_OFF);
    if (index < client.purchases.length - 1) {
      lines.push(`${divider()}\n`);
    }
  });

  lines.push(`${decorativeBorder()}\n`);
  lines.push(BOLD_ON, TALL_SIZE_ON);
  lines.push(`${rightAlignedLine("Total pagado ", formatMoney(total))}\n`);
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

// heading: "SU LOGO" para el ticket del cliente (default), o "COMANDA"/
// "ARCHIVO" para las otras copias -- ver buildSaleTicketLines. Es lo
// unico que cambia entre una copia y otra.
function buildFullTicketLines(sales: EjemploSale[], clientName?: string, heading: string = STORE_NAME) {
  const lines: string[] = [];

  const first = sales[0];
  const total = sales.reduce((sum, sale) => sum + sale.total, 0);

  lines.push(ESC_INIT);
  lines.push(ALIGN_CENTER);
  lines.push(BOLD_ON, DOUBLE_SIZE_ON);
  lines.push(`${heading}\n`);
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

