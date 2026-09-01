import { useState } from "react";
import { EjemploClient, EjemploPaymentMethod, PAYMENT_METHOD_LABELS } from "../ejemplo.types";

const METHODS: EjemploPaymentMethod[] = ["efectivo", "tarjeta", "transferencia", "cuenta"];

type PaymentMethodModalProps = {
  total: number;
  clients: EjemploClient[];
  isSubmitting: boolean;
  onConfirm: (paymentMethod: EjemploPaymentMethod, clientId?: string, customerName?: string) => void;
  onClose: () => void;
};

export function PaymentMethodModal({ total, clients, isSubmitting, onConfirm, onClose }: PaymentMethodModalProps) {
  const [method, setMethod] = useState<EjemploPaymentMethod>("efectivo");
  const [clientId, setClientId] = useState("");
  const [customerName, setCustomerName] = useState("");

  function handleConfirm() {
    if (method === "cuenta" && !clientId) return;
    onConfirm(
      method,
      method === "cuenta" ? clientId : undefined,
      method === "cuenta" ? undefined : customerName.trim() || undefined
    );
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
              {PAYMENT_METHOD_LABELS[value]}
            </button>
          ))}
        </div>

        {method === "cuenta" ? (
          <label className="ejemplo-field">
            <span>Cliente</span>
            <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
              <option value="">Seleccionar...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="ejemplo-field">
            <span>Nombre del cliente (opcional)</span>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Ej: Juan"
            />
          </label>
        )}

        <div className="ejemplo-modal__footer">
          <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ejemplo-button"
            onClick={handleConfirm}
            disabled={isSubmitting || (method === "cuenta" && !clientId)}
          >
            {isSubmitting ? "Registrando..." : "Confirmar"}
          </button>
        </div>
      </article>
    </div>
  );
}
