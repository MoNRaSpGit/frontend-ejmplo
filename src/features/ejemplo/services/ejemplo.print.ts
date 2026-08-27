import qz from "qz-tray";
import { buildSaleTicketLines } from "./ejemplo.ticketFormat";
import { EjemploSale } from "../ejemplo.types";

// Impresion via QZ Tray con comandos ESC/POS crudos (igual que joker), para
// que el ticket salga nitido y con corte de papel en la termica -- el
// window.print() de una pagina HTML salia clarito (rasterizado y ditheado
// por el driver) y con los margenes cortados.
//
// Sin firma: este proyecto es una demo que se corre en una PC propia, asi
// que QZ muestra un cartel "Permitir" una vez por sesion en vez de usar
// certificado. No hay backend involucrado.

const PREFERRED_PRINTER_STORAGE_KEY = "ejemplo.qz.preferredPrinter";

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
