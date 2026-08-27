import { EjemploSale, PAYMENT_METHOD_LABELS } from "./ejemplo.types";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMoney(value: number) {
  return value.toLocaleString("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Mismo formato clasico de ticket 80mm que usa joker (header, seccion de
// cliente/pago, items con precio, total, pie), pero con placeholder de logo
// en vez de la marca real -- es para mostrarle a un cliente potencial como
// queda un ticket, no para un negocio puntual.
export function printSaleTicket(sale: EjemploSale, clientName?: string) {
  const now = new Date(sale.createdAt);

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Ticket ${sale.id}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font-family: "Courier New", monospace; font-size: 12px; width: 72mm; margin: 0; }
  .center { text-align: center; }
  h1 { font-size: 16px; text-align: center; margin: 0 0 2px; letter-spacing: 0.05em; }
  .meta { text-align: center; margin-bottom: 4px; }
  .meta small { display: block; }
  .border { border-top: 1px dashed #000; margin: 6px 0; }
  .customer { margin: 6px 0; }
  .customer div { font-weight: bold; }
  .row { display: flex; justify-content: space-between; gap: 8px; font-weight: bold; }
  .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 4px; }
  .footer { text-align: center; margin-top: 10px; font-weight: bold; }
</style>
</head>
<body>
  <h1>TU LOGO</h1>
  <div class="meta">
    <small>${now.toLocaleString("es-UY")}</small>
    <small>Uso interno</small>
  </div>
  <div>Venta #${sale.id}</div>

  <div class="border"></div>
  <div class="customer">
    <div>Cliente: ${clientName ? escapeHtml(clientName) : "-"}</div>
    <div>Pago: ${PAYMENT_METHOD_LABELS[sale.paymentMethod]}</div>
  </div>
  <div class="border"></div>

  <div class="row">
    <span>${sale.quantity}x ${escapeHtml(sale.productName)}</span>
    <span>$${formatMoney(sale.total)}</span>
  </div>

  <div class="border"></div>
  <div class="total-row"><span>Total</span><span>$${formatMoney(sale.total)}</span></div>

  <div class="footer">Gracias por tu compra!</div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
