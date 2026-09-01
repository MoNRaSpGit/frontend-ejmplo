import { LayoutDashboard, Menu, Printer, ShoppingBag, UserRound, Users } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { toast } from "react-toastify";
import { listClients, listProducts, listRubros } from "./ejemplo.client";
import { ClientesScreen } from "./screens/ClientesScreen";
import { PanelScreen } from "./screens/PanelScreen";
import { ProductosScreen } from "./screens/ProductosScreen";
import { PrinterSettingsModal } from "./components/PrinterSettingsModal";
import { getPreferredPrinterName } from "./services/ejemplo.print";
import { EjemploClient, EjemploProduct } from "./ejemplo.types";

type ViewMode = "productos" | "clientes" | "panel";

const VIEW_LABELS: Record<ViewMode, string> = {
  productos: "Productos",
  clientes: "Clientes",
  panel: "Panel de control"
};

const VIEW_ICONS: Record<ViewMode, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  productos: ShoppingBag,
  clientes: Users,
  panel: LayoutDashboard
};

const VIEW_ORDER: ViewMode[] = ["productos", "clientes", "panel"];

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
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(() => getPreferredPrinterName());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  if (isLoading) {
    return (
      <main className="ejemplo-app">
        <p className="ejemplo-empty">Cargando...</p>
      </main>
    );
  }

  return (
    <div className="ejemplo-app ejemplo-app--with-sidebar">
      <header className="ejemplo-topbar">
        <div className="ejemplo-topbar__inner">
          <div className="ejemplo-brand">
            <span className="ejemplo-brand__mark" aria-hidden="true">
              {rubro ? capitalize(rubro).charAt(0) : "D"}
            </span>
            <div>
              <strong>{rubro ? capitalize(rubro) : "Sistema de venta"}</strong>
            </div>
          </div>

          <div className="ejemplo-user-menu" ref={menuRef}>
            <button
              type="button"
              className="ejemplo-user-menu-btn"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-expanded={isMenuOpen}
              aria-label="Abrir menu"
            >
              <UserRound size={16} strokeWidth={2} />
              <Menu size={16} strokeWidth={2} />
            </button>

            {isMenuOpen ? (
              <div className="ejemplo-user-dropdown">
                <label className="ejemplo-user-dropdown-field">
                  <span>Rubro</span>
                  <select value={rubro} onChange={(event) => setRubro(event.target.value)}>
                    {rubros.map((item) => (
                      <option key={item} value={item}>
                        {capitalize(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ejemplo-user-dropdown-divider" />
                <button
                  type="button"
                  className="ejemplo-user-dropdown-item"
                  onClick={() => {
                    setIsPrinterModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <Printer size={16} strokeWidth={2} />
                  {printerName || "Elegir impresora"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="ejemplo-shell">
        {viewMode === "productos" ? (
          <ProductosScreen rubro={rubro} products={products} clients={clients} onProductsChange={setProducts} />
        ) : null}
        {viewMode === "clientes" ? <ClientesScreen clients={clients} onClientsChange={setClients} /> : null}
        {viewMode === "panel" ? <PanelScreen rubro={rubro} /> : null}
      </main>

      <nav className="ejemplo-sidebar" aria-label="Secciones">
        <span className="ejemplo-sidebar__mark" aria-hidden="true">
          {rubro ? capitalize(rubro).charAt(0) : "D"}
        </span>
        <div className="ejemplo-sidebar__divider" />
        <ul className="ejemplo-sidebar__list">
          {VIEW_ORDER.map((mode) => {
            const Icon = VIEW_ICONS[mode];
            const isActive = viewMode === mode;
            return (
              <li key={mode}>
                <button
                  type="button"
                  className={`ejemplo-sidebar__item${isActive ? " is-active" : ""}`}
                  onClick={() => setViewMode(mode)}
                  aria-current={isActive ? "page" : undefined}
                  title={VIEW_LABELS[mode]}
                >
                  <Icon size={20} strokeWidth={2} />
                  <span className="ejemplo-sidebar__label">{VIEW_LABELS[mode]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {isPrinterModalOpen ? (
        <PrinterSettingsModal
          currentPrinterName={printerName}
          onClose={() => setIsPrinterModalOpen(false)}
          onPrinterChange={setPrinterName}
        />
      ) : null}
    </div>
  );
}
