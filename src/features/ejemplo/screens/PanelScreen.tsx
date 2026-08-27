import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getPanelSummary } from "../ejemplo.client";
import { EjemploPanelSummary, PAYMENT_METHOD_LABELS } from "../ejemplo.types";

type PanelScreenProps = {
  rubro: string;
};

export function PanelScreen({ rubro }: PanelScreenProps) {
  const [summary, setSummary] = useState<EjemploPanelSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getPanelSummary(rubro)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => {
        if (active) toast.error("No se pudo cargar el panel.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [rubro]);

  if (isLoading) {
    return <p className="ejemplo-empty">Cargando panel...</p>;
  }

  if (!summary) {
    return <p className="ejemplo-empty">No hay datos todavia.</p>;
  }

  return (
    <section className="ejemplo-screen">
      <div className="ejemplo-metrics-grid">
        <article className="ejemplo-panel ejemplo-metric">
          <span>Total vendido hoy</span>
          <strong>${summary.totalVendido.toFixed(2)}</strong>
        </article>
        <article className="ejemplo-panel ejemplo-metric">
          <span>Ventas hoy</span>
          <strong>{summary.ventasCount}</strong>
        </article>
      </div>

      <article className="ejemplo-panel">
        <h2>Por forma de pago</h2>
        <div className="ejemplo-entries-list">
          {(Object.keys(summary.paymentTotals) as Array<keyof typeof summary.paymentTotals>).map((method) => (
            <div key={method} className="ejemplo-entry-row">
              <span>{PAYMENT_METHOD_LABELS[method]}</span>
              <strong>${summary.paymentTotals[method].toFixed(2)}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="ejemplo-panel">
        <h2>Mas vendidos hoy</h2>
        <div className="ejemplo-entries-list">
          {summary.topProducts.map((product) => (
            <div key={product.productName} className="ejemplo-entry-row">
              <span>{product.productName}</span>
              <span>x{product.quantity}</span>
              <strong>${product.total.toFixed(2)}</strong>
            </div>
          ))}
          {!summary.topProducts.length ? <p className="ejemplo-empty">Todavia no hay ventas hoy.</p> : null}
        </div>
      </article>
    </section>
  );
}
