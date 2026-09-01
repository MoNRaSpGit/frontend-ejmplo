import { Boxes, LayoutDashboard, Menu, Printer, ShoppingBag, Store, UserRound, Users } from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { toast } from "react-toastify";
import { listClients, listProducts, listRubros } from "./ejemplo.client";
import { ClientesScreen } from "./screens/ClientesScreen";
import { PanelScreen } from "./screens/PanelScreen";
import { ProductosScreen } from "./screens/ProductosScreen";
import { StockScreen } from "./screens/StockScreen";
import { PrinterSettingsModal } from "./components/PrinterSettingsModal";
import { getPreferredPrinterName, getPrintMethod } from "./services/ejemplo.print";
import { getCachedUsbPrinterName, primeUsbPrinterConnection } from "./services/ejemplo.webusbPrint";
import { EjemploClient, EjemploProduct } from "./ejemplo.types";

type ViewMode = "productos" | "stock" | "clientes" | "panel";

const VIEW_LABELS: Record<ViewMode, string> = {
  productos: "Productos",
  stock: "Stock",
  clientes: "Clientes",
  panel: "Panel de control"
};

const VIEW_ICONS: Record<ViewMode, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  productos: ShoppingBag,
  stock: Boxes,
  clientes: Users,
  panel: LayoutDashboard
};

const VIEW_ORDER: ViewMode[] = ["productos", "stock", "clientes", "panel"];

// Placeholder de marca (mismo criterio que el ticket, ver STORE_NAME en
// ejemplo.ticketFormat.ts): en vez de mostrar el rubro elegido ("Cafeteria",
// "Pesca") como si fuera el nombre del negocio, se deja un lugar generico
// para el logo real del cliente -- el rubro sigue funcionando igual por
// atras (sigue filtrando productos), solo que ya no se muestra como marca.
const BRAND_PLACEHOLDER = "SU LOGO";

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
  // No hay estado de React para el metodo elegido (qz/webusb) ni para el
  // nombre del dispositivo USB -- viven en modulos aparte (ejemplo.print.ts
  // / ejemplo.webusbPrint.ts). Este contador solo fuerza un re-render al
  // cerrar el modal, para que la etiqueta del boton "Impresora" (mas abajo)
  // recalcule esos valores en vez de quedar con lo que tenia al abrir.
  const [printerSettingsVersion, setPrinterSettingsVersion] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Detecta en silencio (sin pedir permiso) si ya hay una impresora USB
  // autorizada de una sesion anterior en este navegador -- solo aplica si
  // el metodo elegido es "webusb" (tablet/Android).
  useEffect(() => {
    void primeUsbPrinterConnection();
  }, []);

  void printerSettingsVersion;
  const printerButtonLabel =
    getPrintMethod() === "webusb" ? getCachedUsbPrinterName() || "Elegir impresora" : printerName || "Elegir impresora";

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
              <Store size={20} strokeWidth={2} />
            </span>
            <div>
              <strong>{BRAND_PLACEHOLDER}</strong>
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
                  {printerButtonLabel}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="ejemplo-shell">
        {viewMode === "productos" ? <ProductosScreen products={products} clients={clients} /> : null}
        {viewMode === "stock" ? (
          <StockScreen rubro={rubro} products={products} onProductsChange={setProducts} />
        ) : null}
        {viewMode === "clientes" ? <ClientesScreen clients={clients} onClientsChange={setClients} /> : null}
        {viewMode === "panel" ? <PanelScreen rubro={rubro} /> : null}
      </main>

      <nav className="ejemplo-sidebar" aria-label="Secciones">
        <span className="ejemplo-sidebar__mark" aria-hidden="true">
          <Store size={20} strokeWidth={2} />
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
          onClose={() => {
            setIsPrinterModalOpen(false);
            setPrinterSettingsVersion((current) => current + 1);
          }}
          onPrinterChange={setPrinterName}
        />
      ) : null}
    </div>
  );
}
