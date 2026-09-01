import { useState } from "react";
import { MockClient } from "../ejemplo.mockClients";

// Metodos de cobro que ve el operario en este modal. No es lo mismo que
// EjemploPaymentMethod (el que guarda el backend): "cliente" es un metodo
// solo de UI -- interna mente se registra como una venta en efectivo (no
// se manda clientId al backend) y la "deuda" se lleva aparte, en el
// estado ficticio de ejemplo.mockClients.ts (ver ProductosScreen.tsx /
// EjemploHomePage.tsx). El dia que "Cliente" pase a ser cuenta corriente
// de verdad, esto vuelve a mandar paymentMethod "cuenta" + clientId real.
export type UiPaymentMethod = "efectivo" | "tarjeta" | "cliente";

const METHODS: UiPaymentMethod[] = ["efectivo", "tarjeta", "cliente"];

const METHOD_LABELS: Record<UiPaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "POS",
  cliente: "Cliente"
};

type PaymentMethodModalProps = {
  total: number;
  mockClients: MockClient[];
  isSubmitting: boolean;
  onConfirm: (paymentMethod: UiPaymentMethod, mockClientId?: string) => void;
  onClose: () => void;
};

export function PaymentMethodModal({ total, mockClients, isSubmitting, onConfirm, onClose }: PaymentMethodModalProps) {
  const [method, setMethod] = useState<UiPaymentMethod>("efectivo");
  const [mockClientId, setMockClientId] = useState("");

  function handleConfirm() {
    if (method === "cliente" && !mockClientId) return;
    onConfirm(method, method === "cliente" ? mockClientId : undefined);
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

        {method === "cliente" ? (
          <label className="ejemplo-field">
            <span>Cliente</span>
            <select value={mockClientId} onChange={(event) => setMockClientId(event.target.value)}>
              <option value="">Seleccionar...</option>
              {mockClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="ejemplo-modal__footer">
          <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ejemplo-button"
            onClick={handleConfirm}
            disabled={isSubmitting || (method === "cliente" && !mockClientId)}
          >
            {isSubmitting ? "Registrando..." : "Confirmar"}
          </button>
        </div>
      </article>
    </div>
  );
}
