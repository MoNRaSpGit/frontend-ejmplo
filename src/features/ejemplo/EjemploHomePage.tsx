import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { listClients, listProducts, listRubros } from "./ejemplo.client";
import { ClientesScreen } from "./screens/ClientesScreen";
import { PanelScreen } from "./screens/PanelScreen";
import { ProductosScreen } from "./screens/ProductosScreen";
import { EjemploClient, EjemploProduct } from "./ejemplo.types";

type ViewMode = "productos" | "clientes" | "panel";

const VIEW_LABELS: Record<ViewMode, string> = {
  productos: "Productos",
  clientes: "Clientes",
  panel: "Panel de control"
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function EjemploHomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("productos");
  const [rubros, setRubros] = useState<string[]>([]);
  const [rubro, setRubro] = useState("");
  const [products, setProducts] = useState<EjemploProduct[]>([]);
  const [clients, setClients] = useState<EjemploClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const [rubroItems, clientItems] = await Promise.all([listRubros(), listClients()]);
        if (!active) return;
        setRubros(rubroItems);
        setClients(clientItems);
        setRubro((current) => current || rubroItems[0] || "");
      } catch {
        if (active) toast.error("No se pudo conectar con el servidor.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadInitial();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!rubro) return;
    let active = true;

    listProducts(rubro)
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch(() => {
        if (active) toast.error("No se pudieron cargar los productos.");
      });

    return () => {
      active = false;
    };
  }, [rubro]);

  if (isLoading) {
    return (
      <main className="ejemplo-app">
        <p className="ejemplo-empty">Cargando demo...</p>
      </main>
    );
  }

  return (
    <main className="ejemplo-app">
      <header className="ejemplo-header">
        <div className="ejemplo-header__inner">
          <div className="ejemplo-header__brand">
            <strong>{rubro ? capitalize(rubro) : "Sistema de venta"} — Demo</strong>
            <p>Ejemplo de sistema de venta, personalizable segun el rubro del cliente.</p>
          </div>

          <label className="ejemplo-rubro-picker">
            <span>Rubro</span>
            <select value={rubro} onChange={(event) => setRubro(event.target.value)}>
              {rubros.map((item) => (
                <option key={item} value={item}>
                  {capitalize(item)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <nav className="ejemplo-nav">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`ejemplo-nav__item ${viewMode === mode ? "is-active" : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </nav>
      </header>

      <div className="ejemplo-shell">
        {viewMode === "productos" ? (
          <ProductosScreen rubro={rubro} products={products} clients={clients} onProductsChange={setProducts} />
        ) : null}
        {viewMode === "clientes" ? <ClientesScreen clients={clients} onClientsChange={setClients} /> : null}
        {viewMode === "panel" ? <PanelScreen rubro={rubro} /> : null}
      </div>
    </main>
  );
}
