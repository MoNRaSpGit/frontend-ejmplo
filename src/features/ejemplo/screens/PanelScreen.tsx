import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getPanelSummary, listSales } from "../ejemplo.client";
import { EjemploPanelSummary, EjemploPaymentMethod, EjemploSale, PAYMENT_METHOD_LABELS } from "../ejemplo.types";

const PAYMENT_METHODS: EjemploPaymentMethod[] = ["efectivo", "tarjeta", "transferencia", "cuenta"];
const MOVEMENTS_PREVIEW_COUNT = 3;
const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_CLASSES = ["ejemplo-qty-badge--gold", "ejemplo-qty-badge--silver", "ejemplo-qty-badge--bronze"];

function formatMoney(value: number) {
  return value.toLocaleString("es-UY", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
}

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
}

function isToday(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

type PanelScreenProps = {
  rubro: string;
};

export function PanelScreen({ rubro }: PanelScreenProps) {
  const [summary, setSummary] = useState<EjemploPanelSummary | null>(null);
  const [sales, setSales] = useState<EjemploSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllMovements, setShowAllMovements] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    Promise.all([getPanelSummary(rubro), listSales(rubro)])
      .then(([summaryData, salesData]) => {
        if (!active) return;
        setSummary(summaryData);
        setSales(salesData.filter((sale) => isToday(sale.createdAt)));
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
    return <p className="ejemplo-empty-state">Cargando panel...</p>;
  }

  if (!summary) {
    return <p className="ejemplo-empty-state">No hay datos todavia.</p>;
  }

  const visibleSales = showAllMovements ? sales : sales.slice(0, MOVEMENTS_PREVIEW_COUNT);
  const hasHiddenMovements = sales.length > MOVEMENTS_PREVIEW_COUNT;

  return (
    <section className="ejemplo-screen">
      <article className="ejemplo-panel">
        <div className="ejemplo-panel__heading">
          <p className="ejemplo-eyebrow">Hoy</p>
          <h2>Resumen del dia</h2>
        </div>

        <div className="ejemplo-stat-grid">
          <div className="ejemplo-stat-tile">
            <span className="ejemplo-stat-tile__label">Vendido</span>
            <strong className="ejemplo-stat-tile__value ejemplo-amount-plus">+{formatMoney(summary.totalVendido)}</strong>
          </div>
          <div className="ejemplo-stat-tile">
            <span className="ejemplo-stat-tile__label">Ventas</span>
            <strong className="ejemplo-stat-tile__value">{summary.ventasCount}</strong>
          </div>
        </div>
      </article>

      <article className="ejemplo-panel">
        <div className="ejemplo-panel__heading">
          <p className="ejemplo-eyebrow">Hoy</p>
          <h2>Tipo de pagos</h2>
        </div>

        <div className="ejemplo-stat-grid">
          {PAYMENT_METHODS.map((method) => (
            <div key={method} className={`ejemplo-stat-tile ejemplo-stat-tile--${method}`}>
              <span className="ejemplo-stat-tile__label">{PAYMENT_METHOD_LABELS[method]}</span>
              <strong className="ejemplo-stat-tile__value ejemplo-amount-plus">+{formatMoney(summary.paymentTotals[method])}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="ejemplo-panel">
        <div className="ejemplo-panel__heading ejemplo-panel__heading--row">
          <p className="ejemplo-eyebrow">Movimientos</p>
          {hasHiddenMovements ? (
            <button type="button" className="ejemplo-mini-button" onClick={() => setShowAllMovements((current) => !current)}>
              {showAllMovements ? "Ver menos" : "Ver todos"}
            </button>
          ) : null}
        </div>

        {sales.length ? (
          <ul className="ejemplo-order-list">
            {visibleSales.map((sale) => (
              <li key={sale.id} className="ejemplo-order-item">
                <div className="ejemplo-order-item__info">
                  <span className="ejemplo-qty-badge">{sale.quantity}</span>
                  <div>
                    <strong>{sale.productName}</strong>
                    <p className="ejemplo-hint">
                      {formatTime(sale.createdAt)} · {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                    </p>
                  </div>
                </div>
                <strong className="ejemplo-amount-plus">+{formatMoney(sale.total)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ejemplo-empty-state">Todavia no hay ventas hoy.</p>
        )}
      </article>

      <article className="ejemplo-panel">
        <div className="ejemplo-panel__heading">
          <p className="ejemplo-eyebrow">Ranking</p>
          <h2>Productos mas vendidos</h2>
        </div>

        {summary.topProducts.length ? (
          <ul className="ejemplo-order-list">
            {summary.topProducts.map((product, index) => (
              <li key={product.productName} className="ejemplo-order-item">
                <div className="ejemplo-order-item__info">
                  <span className={`ejemplo-qty-badge ${MEDAL_CLASSES[index] ?? ""}`}>{MEDALS[index] ?? `#${index + 1}`}</span>
                  <strong>{product.productName}</strong>
                </div>
                <span className="ejemplo-qty-badge">{product.quantity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ejemplo-empty-state">Todavia no hay ventas hoy.</p>
        )}
      </article>
    </section>
  );
}
