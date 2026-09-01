import qz from "qz-tray";
import { API_BASE_URL } from "../../../shared/config/api";
import { buildSaleTicketLines } from "./ejemplo.ticketFormat";
import { EjemploSale } from "../ejemplo.types";

// Impresion via QZ Tray con comandos ESC/POS crudos (igual que joker), para
// que el ticket salga nitido y con corte de papel en la termica -- el
// window.print() de una pagina HTML salia clarito (rasterizado y ditheado
// por el driver) y con los margenes cortados.
//
// Firma cada conexion con el certificado del backend (mismo mecanismo y
// mismo certificado que ya usa joker -- ver EjemploPrintingService en el
// backend) para que QZ Tray confie en el sitio automaticamente: sin esto,
// QZ muestra un cartel de "Signature (missing) / Validity (invalid)" en
// cada conexion y no deja marcar "Recordar esta accion" de forma
// permanente.
const PREFERRED_PRINTER_STORAGE_KEY = "ejemplo.qz.preferredPrinter";

let qzSecurityConfigured = false;

function configureQzSecurity() {
  if (qzSecurityConfigured) return;
  qzSecurityConfigured = true;

  qz.security.setCertificatePromise((resolve, reject) => {
    fetch(`${API_BASE_URL}/api/v1/ejemplo/qz-certificate`)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error("No se pudo obtener el certificado."))))
      .then(resolve)
      .catch(reject);
  });

  qz.security.setSignatureAlgorithm("SHA512");
  qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
    fetch(`${API_BASE_URL}/api/v1/ejemplo/qz-sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toSign })
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("No se pudo firmar la conexion."))))
      .then((data: { signature: string }) => resolve(data.signature))
      .catch(reject);
  });
}

function readPreferredPrinter(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PREFERRED_PRINTER_STORAGE_KEY);
}

let cachedPrinterName: string | null = readPreferredPrinter();

export function getPreferredPrinterName() {
  return cachedPrinterName;
}

export function setPreferredPrinterName(name: string) {
  cachedPrinterName = name;
  window.localStorage.setItem(PREFERRED_PRINTER_STORAGE_KEY, name);
}

export function clearPreferredPrinterName() {
  cachedPrinterName = null;
  window.localStorage.removeItem(PREFERRED_PRINTER_STORAGE_KEY);
}

async function ensureQzConnected() {
  configureQzSecurity();
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
}

export async function listQzPrinters() {
  await ensureQzConnected();
  const printers = await qz.printers.find();
  return Array.isArray(printers) ? printers : [];
}

async function printRawLinesByQz(lines: string[]) {
  await ensureQzConnected();

  if (!cachedPrinterName) {
    throw new Error('Todavia no elegiste una impresora. Toca "Impresora" para elegirla.');
  }

  const config = qz.configs.create(cachedPrinterName, { encoding: "CP437" });

  try {
    await qz.print(config, lines);
  } catch (error) {
    throw new Error(
      `No se pudo imprimir en "${cachedPrinterName}". ${
        error instanceof Error ? error.message : "Revisa que siga siendo la impresora correcta (boton Impresora)."
      }`
    );
  }

  return { printerName: cachedPrinterName };
}

export async function printSaleTicket(sales: EjemploSale[], clientName?: string) {
  const lines = buildSaleTicketLines(sales, clientName);
  if (!lines.length) return;
  await printRawLinesByQz(lines);
}
