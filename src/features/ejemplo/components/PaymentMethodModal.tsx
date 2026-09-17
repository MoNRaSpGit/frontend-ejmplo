import { useMemo, useState } from "react";
import { EjemploClient } from "../ejemplo.types";

// Metodos de cobro que ve el operario en este modal. Antes "cliente" era
// solo de UI y la deuda se llevaba en un estado ficticio en memoria (ver
// ejemplo.mockClients.ts, ya eliminado). Pedido explicito del usuario:
// "que a la hora de pagar no diga cliente diga credito y habra los
// clientes que tenemos registrados... elimina los de prueba y pone los
// que ingresemos nosotros" -- ahora "credito" usa los clientes reales
// (los mismos de la pantalla Clientes) y manda paymentMethod "cuenta" +
// clientId real al backend, que ya sabe crear el movimiento de cuenta
// corriente (ver EjemploSalesService.createSale).
export type UiPaymentMethod = "efectivo" | "tarjeta" | "credito";

const METHODS: UiPaymentMethod[] = ["efectivo", "tarjeta", "credito"];

const METHOD_LABELS: Record<UiPaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "POS",
  credito: "Credito"
};

type PaymentMethodModalProps = {
  total: number;
  clients: EjemploClient[];
  isSubmitting: boolean;
  onConfirm: (paymentMethod: UiPaymentMethod, clientId?: string) => void;
  onClose: () => void;
};

export function PaymentMethodModal({ total, clients, isSubmitting, onConfirm, onClose }: PaymentMethodModalProps) {
  const [method, setMethod] = useState<UiPaymentMethod>("efectivo");
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((client) => client.name.toLowerCase().includes(term));
  }, [clients, clientSearch]);

  function handleConfirm() {
    if (method === "credito" && !clientId) return;
    onConfirm(method, method === "credito" ? clientId : undefined);
  }

  return (
    <div className="ejemplo-modal" role="presentation" onClick={onClose}>
      <div className="ejemplo-modal__backdrop" />
      <article className="ejemplo-modal__dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Cobrar</h2>
        <p className="ejemplo-modal__total">Total: ${total.toFixed(2)}</p>

        <div className="ejemplo-payment-chips">
          {METHODS.map((value) => (
            <button
              key={value}
              type="button"
              className={`ejemplo-chip ${method === value ? "is-selected" : ""}`}
              onClick={() => setMethod(value)}
            >
              {METHOD_LABELS[value]}
            </button>
          ))}
        </div>

        {method === "credito" ? (
          <div className="ejemplo-field">
            <span>Cliente</span>
            <input
              className="ejemplo-search"
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="Buscar cliente..."
            />
            <div className="ejemplo-client-list ejemplo-client-list--compact">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`ejemplo-client-row ${clientId === client.id ? "is-selected" : ""}`}
                  onClick={() => setClientId(client.id)}
                >
                  <strong>{client.name}</strong>
                </div>
              ))}
              {!filteredClients.length ? (
                <p className="ejemplo-empty">
                  {clients.length ? "Sin resultados." : "No hay clientes cargados. Agregalos en la pantalla Clientes."}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="ejemplo-modal__footer">
          <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ejemplo-button"
            onClick={handleConfirm}
            disabled={isSubmitting || (method === "credito" && !clientId)}
          >
            {isSubmitting ? "Registrando..." : "Confirmar"}
          </button>
        </div>
      </article>
    </div>
  );
}
