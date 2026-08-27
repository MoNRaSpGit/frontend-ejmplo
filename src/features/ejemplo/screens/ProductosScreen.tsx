import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { PaymentMethodModal } from "../components/PaymentMethodModal";
import { createProduct, createSale, deleteProduct } from "../ejemplo.client";
import { EjemploClient, EjemploPaymentMethod, EjemploProduct } from "../ejemplo.types";

type ProductosScreenProps = {
  rubro: string;
  products: EjemploProduct[];
  clients: EjemploClient[];
  onProductsChange: (products: EjemploProduct[]) => void;
};

function emptyForm(rubro: string) {
  return { rubro, category: "", name: "", price: "", description: "" };
}

export function ProductosScreen({ rubro, products, clients, onProductsChange }: ProductosScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<EjemploProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState(emptyForm(rubro));
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) => product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  function handleSelectProduct(product: EjemploProduct) {
    setSelectedProduct(product);
    setQuantity(1);
  }

  async function handleConfirmSale(paymentMethod: EjemploPaymentMethod, clientId?: string) {
    if (!selectedProduct) return;

    setIsSubmittingSale(true);
    try {
      await createSale({ productId: selectedProduct.id, quantity, paymentMethod, clientId });
      toast.success("Venta registrada.");
      setShowPaymentModal(false);
      setSelectedProduct(null);
      setQuantity(1);
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
        description: newProductForm.description.trim()
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

  async function handleDeleteProduct(productId: string) {
    try {
      await deleteProduct(productId);
      onProductsChange(products.filter((product) => product.id !== productId));
      if (selectedProduct?.id === productId) setSelectedProduct(null);
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
          placeholder="Buscar producto por nombre o categoria..."
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
          <button type="button" className="ejemplo-button" onClick={handleCreateProduct} disabled={isSavingProduct}>
            {isSavingProduct ? "Guardando..." : "Guardar producto"}
          </button>
        </article>
      ) : null}

      <div className="ejemplo-product-grid">
        {filteredProducts.map((product) => (
          <article
            key={product.id}
            className={`ejemplo-product-card ${selectedProduct?.id === product.id ? "is-selected" : ""}`}
            onClick={() => handleSelectProduct(product)}
          >
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
                x
              </button>
            </div>
          </article>
        ))}
        {!filteredProducts.length ? <p className="ejemplo-empty">No hay productos para este rubro todavia.</p> : null}
      </div>

      {selectedProduct ? (
        <article className="ejemplo-panel ejemplo-sale-bar">
          <div>
            <strong>{selectedProduct.name}</strong>
            <span> · ${selectedProduct.price.toFixed(2)} c/u</span>
          </div>
          <div className="ejemplo-quantity-stepper">
            <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
              -
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((current) => current + 1)}>
              +
            </button>
          </div>
          <strong>Total: ${(selectedProduct.price * quantity).toFixed(2)}</strong>
          <button type="button" className="ejemplo-button" onClick={() => setShowPaymentModal(true)}>
            Cobrar
          </button>
        </article>
      ) : null}

      {showPaymentModal && selectedProduct ? (
        <PaymentMethodModal
          total={selectedProduct.price * quantity}
          clients={clients}
          isSubmitting={isSubmittingSale}
          onConfirm={handleConfirmSale}
          onClose={() => setShowPaymentModal(false)}
        />
      ) : null}
    </section>
  );
}
