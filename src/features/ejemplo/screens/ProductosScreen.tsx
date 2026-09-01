import { ImagePlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { PaymentMethodModal } from "../components/PaymentMethodModal";
import { createProduct, createSale, deleteProduct } from "../ejemplo.client";
import { fileToCompressedDataUrl } from "../services/ejemplo.image";
import { printSaleTicket } from "../services/ejemplo.print";
import { EjemploClient, EjemploPaymentMethod, EjemploProduct, EjemploSale } from "../ejemplo.types";

type ProductosScreenProps = {
  rubro: string;
  products: EjemploProduct[];
  clients: EjemploClient[];
  onProductsChange: (products: EjemploProduct[]) => void;
};

type CartLine = { product: EjemploProduct; quantity: number };

function emptyForm(rubro: string) {
  return { rubro, category: "", name: "", price: "", description: "", imageUrl: "" };
}

export function ProductosScreen({ rubro, products, clients, onProductsChange }: ProductosScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [printTicket, setPrintTicket] = useState(true);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState(emptyForm(rubro));
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

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

  function openPayment(withTicket: boolean) {
    if (!cart.length) return;
    setPrintTicket(withTicket);
    setShowPaymentModal(true);
  }

  async function handleConfirmSale(paymentMethod: EjemploPaymentMethod, clientId?: string) {
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
      if (printTicket) {
        const client = clientId ? clients.find((item) => item.id === clientId) : undefined;
        try {
          await printSaleTicket(sales, client?.name);
        } catch (printError) {
          // La venta ya quedo registrada; solo fallo la impresion.
          toast.error(
            printError instanceof Error ? printError.message : "La venta se registro pero no se pudo imprimir el ticket."
          );
        }
      }
      setShowPaymentModal(false);
      setCart([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la venta.");
    } finally {
      setIsSubmittingSale(false);
    }
  }

  async function handleCreateProduct() {
    if (!newProductForm.category.trim() || !newProductForm.name.trim() || !newProductForm.price) {
      toast.error("Completa categoria, nombre y precio.");
      return;
    }

    setIsSavingProduct(true);
    try {
      const item = await createProduct({
        rubro,
        category: newProductForm.category.trim(),
        name: newProductForm.name.trim(),
        price: Number(newProductForm.price),
        description: newProductForm.description.trim(),
        imageUrl: newProductForm.imageUrl || undefined
      });
      onProductsChange([...products, item]);
      setNewProductForm(emptyForm(rubro));
      setShowNewProductForm(false);
      toast.success("Producto agregado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el producto.");
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleImageFileChange(file: File | undefined) {
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setNewProductForm((current) => ({ ...current, imageUrl: dataUrl }));
    } catch {
      toast.error("No se pudo procesar la imagen.");
    } finally {
      setIsProcessingImage(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    try {
      await deleteProduct(productId);
      onProductsChange(products.filter((product) => product.id !== productId));
      removeFromCart(productId);
      toast.success("Producto eliminado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el producto.");
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
        <button
          type="button"
          className="ejemplo-button ejemplo-button--ghost"
          onClick={() => {
            setShowNewProductForm((current) => !current);
            setNewProductForm(emptyForm(rubro));
          }}
        >
          {showNewProductForm ? "Cerrar" : "+ Nuevo producto"}
        </button>
      </div>

      {showNewProductForm ? (
        <article className="ejemplo-panel">
          <div className="ejemplo-form-grid">
            <label className="ejemplo-field">
              <span>Categoria</span>
              <input
                value={newProductForm.category}
                onChange={(event) => setNewProductForm((current) => ({ ...current, category: event.target.value }))}
              />
            </label>
            <label className="ejemplo-field">
              <span>Nombre</span>
              <input
                value={newProductForm.name}
                onChange={(event) => setNewProductForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="ejemplo-field">
              <span>Precio</span>
              <input
                type="number"
                min="0"
                value={newProductForm.price}
                onChange={(event) => setNewProductForm((current) => ({ ...current, price: event.target.value }))}
              />
            </label>
            <label className="ejemplo-field">
              <span>Descripcion</span>
              <input
                value={newProductForm.description}
                onChange={(event) => setNewProductForm((current) => ({ ...current, description: event.target.value }))}
              />
            </label>
          </div>

          <div className="ejemplo-image-picker">
            <span className="ejemplo-field-label">Foto del producto (opcional)</span>
            <div className="ejemplo-image-picker__preview">
              {newProductForm.imageUrl ? (
                <img src={newProductForm.imageUrl} alt="" />
              ) : (
                <ImagePlus size={26} strokeWidth={1.5} />
              )}
            </div>
            <div className="ejemplo-image-picker__actions">
              <label className="ejemplo-button ejemplo-button--ghost ejemplo-button--icon-text">
                <ImagePlus size={16} strokeWidth={2} />
                {isProcessingImage ? "Procesando..." : newProductForm.imageUrl ? "Cambiar foto" : "Elegir foto"}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={isProcessingImage}
                  onChange={(event) => void handleImageFileChange(event.target.files?.[0])}
                />
              </label>
              {newProductForm.imageUrl ? (
                <button
                  type="button"
                  className="ejemplo-button--icon"
                  onClick={() => setNewProductForm((current) => ({ ...current, imageUrl: "" }))}
                >
                  <X size={16} strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>

          <button type="button" className="ejemplo-button" onClick={handleCreateProduct} disabled={isSavingProduct}>
            {isSavingProduct ? "Guardando..." : "Guardar producto"}
          </button>
        </article>
      ) : null}

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
                  <button
                    type="button"
                    className="ejemplo-button--icon"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteProduct(product.id);
                    }}
                    aria-label={`Eliminar ${product.name}`}
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
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
              <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={() => openPayment(false)}>
                Cobrar
              </button>
              <button type="button" className="ejemplo-button" onClick={() => openPayment(true)}>
                Cobrar con ticket
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
