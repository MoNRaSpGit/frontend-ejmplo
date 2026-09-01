import { useState } from "react";
import { getCustomizationOptions } from "../ejemplo.customization";
import { EjemploProduct } from "../ejemplo.types";

type CustomizeProductModalProps = {
  product: EjemploProduct;
  onConfirm: (detail: string) => void;
  onClose: () => void;
};

// Modal chico que se abre al tocar un producto: 3 opciones de ejemplo
// segun la categoria (ver ejemplo.customization.ts), todas opcionales.
// Lo elegido se junta en un solo texto ("Canela, Extra shot") que viaja
// como "detail" en la linea del carrito, en la venta y en el ticket.
export function CustomizeProductModal({ product, onConfirm, onClose }: CustomizeProductModalProps) {
  const options = getCustomizationOptions(product.category);
  const [selected, setSelected] = useState<string[]>([]);

  function toggleOption(option: string) {
    setSelected((current) =>
      current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
    );
  }

  function handleConfirm() {
    onConfirm(selected.join(", "));
  }

  return (
    <div className="ejemplo-modal" role="presentation" onClick={onClose}>
      <div className="ejemplo-modal__backdrop" />
      <article className="ejemplo-modal__dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>{product.name}</h2>
        <p className="ejemplo-hint">Elegi como lo queres (opcional).</p>

        <div className="ejemplo-chip-group">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`ejemplo-chip ${selected.includes(option) ? "is-selected" : ""}`}
              onClick={() => toggleOption(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="ejemplo-modal__footer">
          <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="ejemplo-button" onClick={handleConfirm}>
            Agregar
          </button>
        </div>
      </article>
    </div>
  );
}
