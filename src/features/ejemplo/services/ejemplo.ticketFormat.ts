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
import { EjemploPanelSummary, EjemploPaymentMethod, EjemploSale, PAYMENT_METHOD_LABELS } from "../ejemplo.types";

// Placeholder de marca: es una demo para mostrarle a clientes, no un
// negocio puntual (ver ejemplo-ticket viejo en HTML que esto reemplaza).
// Todos los datos son ficticios a proposito, solo para que se vea como
// va a quedar un ticket real (pedido explicito del usuario: "un ticket
// generico q diga su logo, un nombre del cliente, una direccion, todo
// falso, solo para mostrar").
const STORE_NAME = "SU LOGO";
const STORE_ADDRESS = "Av. Ejemplo 1234, Montevideo (dato de ejemplo)";
const INTERNAL_USE_NOTE = "Uso interno";
const FOOTER_MESSAGE = "Gracias por tu compra!";

// copies: cuantas veces se repite el ticket en el mismo trabajo de
// impresion (mismo criterio que joker). Pedido explicito del usuario:
// "que salga solo un ticket" -- antes el default era 2 (ticket cliente +
// copia "COMANDA" para cocina/mostrador), lo que no tiene sentido en una
// demo generica donde no hay cocina. Con 1 sale solo el ticket completo
// para el cliente. Con 2 sale ademas la copia "COMANDA". Con 3 sale
// tambien la copia "ARCHIVO" (para que quede en el local). Con 0 no se
// imprime nada. Se deja la opcion de 2 y 3 en el codigo por si en algun
// rubro puntual (ej. gastronomia) se vuelve a necesitar, pero el default
// y lo que usa la pantalla de Productos ahora es 1.
//
// Las tres copias son el mismo ticket completo (mismos datos: cliente,
// pago, productos con precio, total) -- lo unico que cambia entre una y
// otra es el titulo de arriba ("SU LOGO" para el cliente, "COMANDA" o
// "ARCHIVO" para las otras dos). A proposito, para que las tres se vean
// igual de prolijas -- antes la comanda/archivo era una version distinta,
// sin precios ni datos de pago.
export function buildSaleTicketLines(sales: EjemploSale[], clientName: string | undefined, copies: 0 | 1 | 2 | 3 = 1) {
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


// Ticket de "Cerrar caja" del Panel de control: resumen del dia (tipo de
// pagos, total vendido, top productos) + el detalle de cada movimiento.
// Por ahora es solo para imprimir -- no borra ni resetea nada (a
// diferencia del cierre de joker), asi que se puede tocar las veces que
// haga falta sin perder datos.
export function buildPanelSummaryTicketLines(summary: EjemploPanelSummary, sales: EjemploSale[]) {
  const lines: string[] = [];

  lines.push(ESC_INIT);
  lines.push(ALIGN_CENTER);
  lines.push(BOLD_ON, DOUBLE_SIZE_ON);
  lines.push(`${STORE_NAME}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push(BOLD_ON, TALL_SIZE_ON);
  lines.push("CIERRE DE CAJA\n");
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push(`${new Date().toLocaleString("es-UY", { timeZone: "America/Montevideo" })}\n`);
  lines.push(`${INTERNAL_USE_NOTE}\n`);

  lines.push(ALIGN_LEFT);
  lines.push(`${decorativeBorder()}\n`);
  lines.push(BOLD_ON);
  lines.push("Tipo de pagos\n");
  lines.push(BOLD_OFF);
  lines.push(`${divider()}\n`);

  (Object.keys(PAYMENT_METHOD_LABELS) as EjemploPaymentMethod[]).forEach((method) => {
    if (method === "transferencia") return; // ver PanelScreen: ya no es una opcion al cobrar.
    lines.push(`${rightAlignedLine(`${PAYMENT_METHOD_LABELS[method]} `, formatMoney(summary.paymentTotals[method] ?? 0))}\n`);
  });

  lines.push(`${decorativeBorder()}\n`);
  lines.push(BOLD_ON, TALL_SIZE_ON);
  lines.push(`${rightAlignedLine("Total vendido ", formatMoney(summary.totalVendido))}\n`);
  lines.push(DOUBLE_SIZE_OFF, BOLD_OFF);
  lines.push(`Ventas: ${summary.ventasCount}\n`);
  lines.push("\n");

  lines.push(`${decorativeBorder()}\n`);
  lines.push(BOLD_ON);
  lines.push("Productos mas vendidos\n");
  lines.push(BOLD_OFF);
  lines.push(`${divider()}\n`);

  if (summary.topProducts.length) {
    summary.topProducts.forEach((product, index) => {
      lines.push(`${index + 1}) ${product.quantity}x ${product.productName}\n`);
    });
  } else {
    lines.push("Sin ventas registradas.\n");
  }

  lines.push(`${decorativeBorder()}\n`);
  lines.push(BOLD_ON);
  lines.push(`Movimientos (${sales.length})\n`);
  lines.push(BOLD_OFF);
  lines.push(`${divider()}\n`);

  if (sales.length) {
    sales.forEach((sale) => {
      const time = new Date(sale.createdAt).toLocaleTimeString("es-UY", { timeZone: "America/Montevideo", hour: "2-digit", minute: "2-digit" });
      lines.push(`${rightAlignedLine(`${sale.quantity}x ${sale.productName} `, formatMoney(sale.total))}\n`);
      lines.push(`  ${time} · ${PAYMENT_METHOD_LABELS[sale.paymentMethod]}\n`);
    });
  } else {
    lines.push("Sin movimientos registrados.\n");
  }

  lines.push(`${decorativeBorder()}\n`);
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
  // La copia para el cliente (heading === STORE_NAME) muestra la
  // direccion ficticia de la demo; COMANDA/ARCHIVO son para adentro del
  // local, ahi no tiene sentido una direccion y se deja "Uso interno".
  if (heading === STORE_NAME) {
    lines.push(`${STORE_ADDRESS}\n`);
  } else {
    lines.push(`${INTERNAL_USE_NOTE}\n`);
  }
  lines.push(`${new Date(first.createdAt).toLocaleString("es-UY", { timeZone: "America/Montevideo" })}\n`);

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

