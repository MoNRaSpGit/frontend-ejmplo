import { API_BASE_URL } from "../../shared/config/api";
import type {
  EjemploAccountEntry,
  EjemploClient,
  EjemploPanelSummary,
  EjemploProduct,
  EjemploSale
} from "./ejemplo.types";

function buildUrl(path: string) {
  return `${API_BASE_URL}/api/v1${path}`;
}

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as Partial<T> & { message?: string | string[] };

  if (!response.ok) {
    const message = Array.isArray(data.message) ? data.message[0] : data.message;
    throw new Error(message || `HTTP ${response.status}`);
  }

  return data as T;
}

export async function listRubros() {
  const response = await fetch(buildUrl("/ejemplo/rubros"));
  const data = await readJson<{ items: string[] }>(response);
  return data.items;
}

export async function listProducts(rubro: string) {
  const response = await fetch(buildUrl(`/ejemplo/products?rubro=${encodeURIComponent(rubro)}`));
  const data = await readJson<{ items: EjemploProduct[] }>(response);
  return data.items;
}

export async function createProduct(payload: {
  rubro: string;
  category: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}) {
  const response = await fetch(buildUrl("/ejemplo/products"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: EjemploProduct }>(response);
  return data.item;
}

export async function deleteProduct(productId: string) {
  const response = await fetch(buildUrl(`/ejemplo/products/${productId}`), { method: "DELETE" });
  await readJson<{ ok: boolean }>(response);
}

export async function listClients() {
  const response = await fetch(buildUrl("/ejemplo/clients"));
  const data = await readJson<{ items: EjemploClient[] }>(response);
  return data.items;
}

export async function createClient(payload: { name: string; phone?: string }) {
  const response = await fetch(buildUrl("/ejemplo/clients"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: EjemploClient }>(response);
  return data.item;
}

export async function deleteClient(clientId: string) {
  const response = await fetch(buildUrl(`/ejemplo/clients/${clientId}`), { method: "DELETE" });
  await readJson<{ ok: boolean }>(response);
}

export async function listAccountEntries(clientId: string) {
  const response = await fetch(buildUrl(`/ejemplo/clients/${clientId}/account-entries`));
  const data = await readJson<{ items: EjemploAccountEntry[] }>(response);
  return data.items;
}

export async function settleAccountEntries(clientId: string) {
  const response = await fetch(buildUrl(`/ejemplo/clients/${clientId}/account-entries/settle`), { method: "POST" });
  const data = await readJson<{ items: EjemploAccountEntry[] }>(response);
  return data.items;
}

export async function listSales(rubro: string) {
  const response = await fetch(buildUrl(`/ejemplo/sales?rubro=${encodeURIComponent(rubro)}`));
  const data = await readJson<{ items: EjemploSale[] }>(response);
  return data.items;
}

export async function createSale(payload: {
  productId: string;
  quantity?: number;
  paymentMethod: string;
  clientId?: string;
}) {
  const response = await fetch(buildUrl("/ejemplo/sales"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await readJson<{ item: EjemploSale }>(response);
  return data.item;
}

export async function getPanelSummary(rubro: string) {
  const response = await fetch(buildUrl(`/ejemplo/panel/${encodeURIComponent(rubro)}`));
  return readJson<EjemploPanelSummary>(response);
}
