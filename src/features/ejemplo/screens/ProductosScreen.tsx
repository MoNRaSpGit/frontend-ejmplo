import { ImagePlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { PaymentMethodModal } from "../components/PaymentMethodModal";
import { createSale } from "../ejemplo.client";
import { printSaleTicket } from "../services/ejemplo.print";
import { EjemploClient, EjemploPaymentMethod, EjemploProduct, EjemploSale } from "../ejemplo.types";

type ProductosScreenProps = {
  products: EjemploProduct[];
  clients: EjemploClient[];
};

type CartLine = { product: EjemploProduct; quantity: number };

export function ProductosScreen({ products, clients }: ProductosScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

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

  function addToCart(product: EjemploProduct) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === productId ? { ...line, quantity: line.quantity + delta } : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((line) => line.product.id !== productId));
  }

  function openPayment() {
    if (!cart.length) return;
    setShowPaymentModal(true);
  }

  async function handleConfirmSale(paymentMethod: EjemploPaymentMethod, clientId?: string, customerName?: string) {
    if (!cart.length) return;

    setIsSubmittingSale(true);
    try {
      const sales: EjemploSale[] = [];
      for (const line of cart) {
        const sale = await createSale({
          productId: line.product.id,
          quantity: line.quantity,
          paymentMethod,
          clientId
        });
        sales.push(sale);
      }
      toast.success("Venta registrada.");
      // Cobrar siempre imprime el ticket -- si el cliente eligio cuenta
      // corriente el nombre sale del cliente elegido, si no, del campo
      // "Nombre del cliente" opcional (o nada, si lo dejo en blanco).
      const client = clientId ? clients.find((item) => item.id === clientId) : undefined;
      try {
        await printSaleTicket(sales, client?.name ?? customerName);
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
            <article key={product.id} className="ejemplo-product-card" onClick={() => addToCart(product)}>
              {product.imageUrl ? (
                <img className="ejemplo-product-card__image" src={product.imageUrl} alt="" />
              ) : (
                <div className="ejemplo-product-card__image-placeholder">
                  <ImagePlus size={28} strokeWidth={1.5} />
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
        <p className="ejemplo-empty">Escribi el nombre de un producto para buscarlo y sumarlo a la venta.</p>
      )}

      {cart.length ? (
        <article className="ejemplo-panel ejemplo-cart">
          <h2>Venta actual</h2>
          <div className="ejemplo-client-list">
            {cart.map((line) => (
              <div key={line.product.id} className="ejemplo-cart__line">
                <div>
                  <strong>{line.product.name}</strong>
                  <span> · ${line.product.price.toFixed(2)} c/u</span>
                </div>
                <div className="ejemplo-quantity-stepper">
                  <button type="button" onClick={() => changeQuantity(line.product.id, -1)}>
                    -
                  </button>
                  <span>{line.quantity}</span>
                  <button type="button" onClick={() => changeQuantity(line.product.id, 1)}>
                    +
                  </button>
                </div>
                <strong>${(line.product.price * line.quantity).toFixed(2)}</strong>
                <button
                  type="button"
                  className="ejemplo-button--icon"
                  onClick={() => removeFromCart(line.product.id)}
                  aria-label={`Quitar ${line.product.name}`}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>

          <div className="ejemplo-cart__footer">
            <strong>Total: ${cartTotal.toFixed(2)}</strong>
            <div className="ejemplo-cart__actions">
              <button type="button" className="ejemplo-button" onClick={() => openPayment()}>
                Cobrar
              </button>
            </div>
          </div>
        </article>
      ) : null}

      {showPaymentModal && cart.length ? (
        <PaymentMethodModal
          total={cartTotal}
          clients={clients}
          isSubmitting={isSubmittingSale}
          onConfirm={handleConfirmSale}
          onClose={() => setShowPaymentModal(false)}
        />
      ) : null}
    </section>
  );
}
