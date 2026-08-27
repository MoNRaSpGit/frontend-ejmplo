import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { createClient, deleteClient, listAccountEntries, settleAccountEntries } from "../ejemplo.client";
import { EjemploAccountEntry, EjemploClient } from "../ejemplo.types";

type ClientesScreenProps = {
  clients: EjemploClient[];
  onClientsChange: (clients: EjemploClient[]) => void;
};

export function ClientesScreen({ clients, onClientsChange }: ClientesScreenProps) {
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
    <section className="ejemplo-screen ejemplo-clients-layout">
      <article className="ejemplo-panel">
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
  );
}
