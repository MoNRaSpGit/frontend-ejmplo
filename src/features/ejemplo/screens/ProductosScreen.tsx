import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { CustomizeProductModal } from "../components/CustomizeProductModal";
import { PaymentMethodModal, UiPaymentMethod } from "../components/PaymentMethodModal";
import { createSale } from "../ejemplo.client";
import { printSaleTicket } from "../services/ejemplo.print";
import { EjemploProduct, EjemploSale } from "../ejemplo.types";
import { setAppBusy } from "../../../shared/state/appActivity";
import { MockClient, MockPurchase } from "../ejemplo.mockClients";

type ProductosScreenProps = {
  products: EjemploProduct[];
  mockClients: MockClient[];
  onAddMockPurchases: (clientId: string, purchases: MockPurchase[]) => void;
};

type CartLine = { key: string; product: EjemploProduct; detail: string; quantity: number };

function buildLineKey(productId: string, detail: string) {
  return `${productId}::${detail}`;
}

// Nombre generico para el ticket cuando no se eligio un cliente de cuenta
// (efectivo/POS) -- ver pedido: "poné por defecto Juan, que siempre salga
// Juan". Cuando el cobro es "Cliente" el nombre real sale del cliente de
// prueba elegido (ver handleConfirmSale).
const DEFAULT_CUSTOMER_NAME = "Juan";

// Cuantos tickets salen por venta, fijo (ya no lo elige el operario): el
// ticket completo para el cliente + la copia compacta "COMANDA" para
// cocina/mostrador (ver ejemplo.ticketFormat.ts, copies=2).
const TICKET_COPIES = 2;

export function ProductosScreen({ products, mockClients, onAddMockPurchases }: ProductosScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customizingProduct, setCustomizingProduct] = useState<EjemploProduct | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Mientras haya algo en el carrito, el modal de personalizar o el de
  // cobro abiertos, hay una venta en curso: AppUpdateNotice no debe
  // recargar la pagina sola en ese momento (se perderia la venta a medio
  // hacer).
  useEffect(() => {
    setAppBusy("productos-venta", cart.length > 0 || !!customizingProduct || showPaymentModal);
    return () => setAppBusy("productos-venta", false);
  }, [cart.length, customizingProduct, showPaymentModal]);

  const term = searchTerm.trim().toLowerCase();

  const filteredProducts = useMemo(() => {
    if (!term) return [];
    return products.filter(
      (product) => product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term)
    );
  }, [products, term]);

  const cartTotal = useMemo(
    () => cart.reduce((acc, line) => acc + line.product.price * line.quantity, 0),
    [cart]
  );

  // Dos lineas del mismo producto pero con personalizacion distinta (ej:
  // "Capuccino grande" con canela y otro sin nada) tienen que quedar
  // separadas -- por eso la clave del carrito es producto + detail, no
  // solo el id del producto.
  function addToCart(product: EjemploProduct, detail: string) {
    const key = buildLineKey(product.id, detail);
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) => (line.key === key ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...current, { key, product, detail, quantity: 1 }];
    });
  }

  function changeQuantity(key: string, delta: number) {
    setCart((current) =>
      current.map((line) => (line.key === key ? { ...line, quantity: line.quantity + delta } : line)).filter((line) => line.quantity > 0)
    );
  }

  function removeFromCart(key: string) {
    setCart((current) => current.filter((line) => line.key !== key));
  }

  function openPayment() {
    if (!cart.length) return;
    setShowPaymentModal(true);
  }

  async function handleConfirmSale(uiPaymentMethod: UiPaymentMethod, mockClientId?: string) {
    if (!cart.length) return;

    // "Cliente" es ficticio (ver ejemplo.mockClients.ts): al backend se
    // manda como una venta en efectivo normal, sin clientId -- la "deuda"
    // del cliente de prueba se lleva aparte, solo en memoria.
    const backendPaymentMethod = uiPaymentMethod === "cliente" ? "efectivo" : uiPaymentMethod;
    const mockClient = uiPaymentMethod === "cliente" ? mockClients.find((item) => item.id === mockClientId) : undefined;
    const customerName = mockClient?.name ?? DEFAULT_CUSTOMER_NAME;

    setIsSubmittingSale(true);
    try {
      const sales: EjemploSale[] = [];
      for (const line of cart) {
        const sale = await createSale({
          productId: line.product.id,
          quantity: line.quantity,
          paymentMethod: backendPaymentMethod,
          detail: line.detail || undefined
        });
        sales.push(sale);
      }
      toast.success("Venta registrada.");

      if (mockClient) {
        const today = new Date();
        const dateLabel = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}`;
        onAddMockPurchases(
          mockClient.id,
          cart.map((line) => ({
            id: `mp-${Date.now()}-${line.key}`,
            productName: `${line.quantity}x ${line.product.name}`,
            amount: Math.round(line.product.price * line.quantity * 100) / 100,
            dateLabel
          }))
        );
      }

      try {
        await printSaleTicket(sales, customerName, TICKET_COPIES);
      } catch (printError) {
        // La venta ya quedo registrada; solo fallo la impresion.
        toast.error(
          printError instanceof Error ? printError.message : "La venta se registro pero no se pudo imprimir el ticket."
        );
      }
      setShowPaymentModal(false);
      setCart([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la venta.");
    } finally {
      setIsSubmittingSale(false);
    }
  }

  return (
    <section className="ejemplo-screen">
      <div className="ejemplo-toolbar">
        <input
          className="ejemplo-search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Escribi el nombre del producto..."
        />
      </div>

      {term ? (
        <div className="ejemplo-product-grid">
          {filteredProducts.map((product) => (
            <article key={product.id} className="ejemplo-product-card" onClick={() => setCustomizingProduct(product)}>
              {product.imageUrl ? (
                <img className="ejemplo-product-card__image" src={product.imageUrl} alt="" />
              ) : (
                <div className="ejemplo-product-card__image-placeholder">
                  <ImagePlus size={36} strokeWidth={1.5} />
                </div>
              )}
              <div className="ejemplo-product-card__body">
                <span className="ejemplo-product-card__category">{product.category}</span>
                <strong>{product.name}</strong>
                {product.description ? <p>{product.description}</p> : null}
                <div className="ejemplo-product-card__footer">
                  <strong>${product.price.toFixed(2)}</strong>
                </div>
              </div>
            </article>
          ))}
          {!filteredProducts.length ? <p className="ejemplo-empty">Sin resultados para "{searchTerm}".</p> : null}
        </div>
      ) : (
        <p className="ejemplo-empty">Escribi el nombre de un producto para buscarlo y agregarlo a la venta.</p>
      )}

      {cart.length ? (
        <article className="ejemplo-panel ejemplo-cart">
          <h2>Venta actual</h2>
          <div className="ejemplo-client-list">
            {cart.map((line) => (
              <div key={line.key} className="ejemplo-cart__line">
                <div>
                  <strong>{line.product.name}</strong>
                  <span> · ${line.product.price.toFixed(2)} c/u</span>
                  {line.detail ? <p className="ejemplo-hint">{line.detail}</p> : null}
                </div>
                <div className="ejemplo-quantity-stepper">
                  <button type="button" onClick={() => changeQuantity(line.key, -1)}>
                    -
                  </button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => changeQuantity(line.key, 1)}>
                    +
                  </button>
                </div>
                <strong>${(line.product.price * line.quantity).toFixed(2)}</strong>
                <button
                  type="button"
                  className="ejemplo-button--icon"
                  onClick={() => removeFromCart(line.key)}
                  aria-label={`Quitar ${line.product.name}`}
                >
                  <X size={21} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>

          {/* Separado visualmente de la lista de arriba (fondo propio, ver
              .ejemplo-cart__checkout en global.css) para que se note que es
              otra parte: el total y el cobro, no otro producto mas. */}
          <div className="ejemplo-cart__checkout">
            <div className="ejemplo-cart__footer">
              <strong>Total: ${cartTotal.toFixed(2)}</strong>
              <div className="ejemplo-cart__actions">
                <button type="button" className="ejemplo-button ejemplo-button--cobrar" onClick={() => openPayment()}>
                  Cobrar
                </button>
              </div>
            </div>
          </div>
        </article>
      ) : null}

      {customizingProduct ? (
        <CustomizeProductModal
          product={customizingProduct}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={(detail) => {
            addToCart(customizingProduct, detail);
            setCustomizingProduct(null);
          }}
        />
      ) : null}

      {showPaymentModal && cart.length ? (
        <PaymentMethodModal
          total={cartTotal}
          mockClients={mockClients}
          isSubmitting={isSubmittingSale}
          onConfirm={handleConfirmSale}
          onClose={() => setShowPaymentModal(false)}
        />
      ) : null}
    </section>
  );
}
