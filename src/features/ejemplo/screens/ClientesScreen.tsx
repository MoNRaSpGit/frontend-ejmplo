import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createClient, deleteClient, listAccountEntries, settleAccountEntries } from "../ejemplo.client";
import { EjemploAccountEntry, EjemploClient } from "../ejemplo.types";
import { MockClient, getMockClientTotal } from "../ejemplo.mockClients";
import { printAccountSettlementTicket } from "../services/ejemplo.print";

type ClientesScreenProps = {
  clients: EjemploClient[];
  onClientsChange: (clients: EjemploClient[]) => void;
  mockClients: MockClient[];
  onSettleMockClient: (clientId: string) => void;
};

// Panel de "cuenta cliente" ficticia (ver ejemplo.mockClients.ts): muestra
// los 3 clientes de prueba con su historial inventado y un boton "Pago"
// que imprime el ticket de saldo y borra la deuda en memoria -- al
// recargar la pagina vuelve a aparecer la deuda original (nada de esto se
// guarda en el backend todavia).
function MockClientsPanel({ mockClients, onSettleMockClient }: { mockClients: MockClient[]; onSettleMockClient: (clientId: string) => void }) {
  const [payingClientId, setPayingClientId] = useState<string | null>(null);

  async function handlePay(client: MockClient) {
    if (!client.purchases.length || payingClientId) return;
    setPayingClientId(client.id);
    try {
      await printAccountSettlementTicket(client);
      onSettleMockClient(client.id);
      toast.success(`Cuenta de ${client.name} saldada.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo imprimir el ticket de pago.");
    } finally {
      setPayingClientId(null);
    }
  }

  return (
    <article className="ejemplo-panel ejemplo-mock-clients">
      <h2>Cuenta cliente (prueba)</h2>
      <p className="ejemplo-hint">
        Datos ficticios para probar el flujo -- al recargar la pagina vuelven a su estado original.
      </p>
      <div className="ejemplo-client-list">
        {mockClients.map((client) => {
          const total = getMockClientTotal(client);
          return (
            <div key={client.id} className="ejemplo-mock-client-card">
              <div className="ejemplo-mock-client-card__header">
                <strong>{client.name}</strong>
                <span className={total > 0 ? "ejemplo-tag ejemplo-tag--pending" : "ejemplo-tag ejemplo-tag--ok"}>
                  {total > 0 ? `Debe $${total.toFixed(2)}` : "Al dia"}
                </span>
              </div>
              {client.purchases.length ? (
                <div className="ejemplo-entries-list">
                  {client.purchases.map((purchase) => (
                    <div key={purchase.id} className="ejemplo-entry-row">
                      <span>{purchase.dateLabel}</span>
                      <span>{purchase.productName}</span>
                      <strong>${purchase.amount.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="ejemplo-empty">Sin compras pendientes.</p>
              )}
              <button
                type="button"
                className="ejemplo-button"
                onClick={() => void handlePay(client)}
                disabled={!client.purchases.length || payingClientId === client.id}
              >
                {payingClientId === client.id ? "Imprimiendo..." : "Pago"}
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function ClientesScreen({ clients, onClientsChange, mockClients, onSettleMockClient }: ClientesScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [entries, setEntries] = useState<EjemploAccountEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: "", phone: "" });
  const [isSavingClient, setIsSavingClient] = useState(false);

  const filteredClients = clients.filter((client) => client.name.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;
  const pendingTotal = entries.filter((entry) => !entry.isSettled).reduce((sum, entry) => sum + entry.total, 0);

  useEffect(() => {
    if (!selectedClientId) {
      setEntries([]);
      return;
    }

    let active = true;
    setIsLoadingEntries(true);
    listAccountEntries(selectedClientId)
      .then((items) => {
        if (active) setEntries(items);
      })
      .catch(() => {
        if (active) toast.error("No se pudo cargar la cuenta corriente.");
      })
      .finally(() => {
        if (active) setIsLoadingEntries(false);
      });

    return () => {
      active = false;
    };
  }, [selectedClientId]);

  async function handleCreateClient() {
    if (!newClientForm.name.trim()) {
      toast.error("Falta el nombre del cliente.");
      return;
    }

    setIsSavingClient(true);
    try {
      const item = await createClient({ name: newClientForm.name.trim(), phone: newClientForm.phone.trim() });
      onClientsChange([...clients, item]);
      setNewClientForm({ name: "", phone: "" });
      toast.success("Cliente agregado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el cliente.");
    } finally {
      setIsSavingClient(false);
    }
  }

  async function handleDeleteClient(clientId: string) {
    try {
      await deleteClient(clientId);
      onClientsChange(clients.filter((client) => client.id !== clientId));
      if (selectedClientId === clientId) setSelectedClientId("");
      toast.success("Cliente eliminado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el cliente.");
    }
  }

  async function handleSettle() {
    if (!selectedClientId) return;
    try {
      const items = await settleAccountEntries(selectedClientId);
      setEntries(items);
      toast.success("Cuenta saldada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo saldar la cuenta.");
    }
  }

  return (
    <section className="ejemplo-screen">
      <MockClientsPanel mockClients={mockClients} onSettleMockClient={onSettleMockClient} />

      <section className="ejemplo-clients-layout">
      <article className="ejemplo-panel">
        <h2>Contactos</h2>
        <div className="ejemplo-toolbar">
          <input
            className="ejemplo-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar cliente..."
          />
        </div>

        <div className="ejemplo-form-grid">
          <label className="ejemplo-field">
            <span>Nombre</span>
            <input value={newClientForm.name} onChange={(event) => setNewClientForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="ejemplo-field">
            <span>Telefono</span>
            <input value={newClientForm.phone} onChange={(event) => setNewClientForm((current) => ({ ...current, phone: event.target.value }))} />
          </label>
        </div>
        <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={handleCreateClient} disabled={isSavingClient}>
          {isSavingClient ? "Guardando..." : "+ Agregar cliente"}
        </button>

        <div className="ejemplo-client-list">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className={`ejemplo-client-row ${selectedClientId === client.id ? "is-selected" : ""}`}
              onClick={() => setSelectedClientId(client.id)}
            >
              <div>
                <strong>{client.name}</strong>
                {client.phone ? <span> · {client.phone}</span> : null}
              </div>
              <button
                type="button"
                className="ejemplo-button--icon"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteClient(client.id);
                }}
                aria-label={`Eliminar ${client.name}`}
              >
                x
              </button>
            </div>
          ))}
          {!filteredClients.length ? <p className="ejemplo-empty">No hay clientes cargados.</p> : null}
        </div>
      </article>

      <article className="ejemplo-panel">
        {selectedClient ? (
          <>
            <h2>{selectedClient.name}</h2>
            <p className="ejemplo-hint">Cuenta corriente</p>
            <div className="ejemplo-balance">Debe: ${pendingTotal.toFixed(2)}</div>

            {isLoadingEntries ? (
              <p className="ejemplo-empty">Cargando...</p>
            ) : (
              <div className="ejemplo-entries-list">
                {entries.map((entry) => (
                  <div key={entry.id} className="ejemplo-entry-row">
                    <span>{new Date(entry.createdAt).toLocaleDateString("es-UY")}</span>
                    <strong>${entry.total.toFixed(2)}</strong>
                    <span className={entry.isSettled ? "ejemplo-tag ejemplo-tag--ok" : "ejemplo-tag ejemplo-tag--pending"}>
                      {entry.isSettled ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                ))}
                {!entries.length ? <p className="ejemplo-empty">Sin movimientos.</p> : null}
              </div>
            )}

            {pendingTotal > 0 ? (
              <button type="button" className="ejemplo-button" onClick={handleSettle}>
                Marcar como pagado
              </button>
            ) : null}
          </>
        ) : (
          <p className="ejemplo-empty">Elegi un cliente para ver su cuenta corriente.</p>
        )}
      </article>
      </section>
    </section>
  );
}
