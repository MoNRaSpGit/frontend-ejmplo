import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { createProduct, deleteProduct } from "../ejemplo.client";
import { fileToCompressedDataUrl } from "../services/ejemplo.image";
import { EjemploProduct } from "../ejemplo.types";

type StockScreenProps = {
  rubro: string;
  products: EjemploProduct[];
  onProductsChange: (products: EjemploProduct[]) => void;
};

function emptyForm(rubro: string) {
  return { rubro, category: "", name: "", price: "", description: "", imageUrl: "" };
}

// Alta y baja de productos, separado de "Productos" (que ahora es solo
// buscar/cobrar) para no marear al que esta atendiendo en el mostrador.
export function StockScreen({ rubro, products, onProductsChange }: StockScreenProps) {
  const [newProductForm, setNewProductForm] = useState(emptyForm(rubro));
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const sortedProducts = [...products].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

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
      toast.success("Producto eliminado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el producto.");
    }
  }

  return (
    <section className="ejemplo-screen">
      <article className="ejemplo-panel">
        <div className="ejemplo-panel__heading">
          <p className="ejemplo-eyebrow">Stock</p>
          <h2>Nuevo producto</h2>
        </div>

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
              <ImagePlus size={34} strokeWidth={1.5} />
            )}
          </div>
          <div className="ejemplo-image-picker__actions">
            <label className="ejemplo-button ejemplo-button--ghost ejemplo-button--icon-text">
              <ImagePlus size={21} strokeWidth={2} />
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
                <X size={21} strokeWidth={2} />
              </button>
            ) : null}
          </div>
        </div>

        <button type="button" className="ejemplo-button" onClick={handleCreateProduct} disabled={isSavingProduct}>
          {isSavingProduct ? "Guardando..." : "Guardar producto"}
        </button>
      </article>

      <article className="ejemplo-panel">
        <div className="ejemplo-panel__heading">
          <p className="ejemplo-eyebrow">Stock</p>
          <h2>Productos cargados</h2>
        </div>

        {sortedProducts.length ? (
          <div className="ejemplo-product-grid">
            {sortedProducts.map((product) => (
              <article key={product.id} className="ejemplo-product-card ejemplo-product-card--static">
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
                    <button
                      type="button"
                      className="ejemplo-button--icon"
                      onClick={() => handleDeleteProduct(product.id)}
                      aria-label={`Eliminar ${product.name}`}
                    >
                      <X size={21} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="ejemplo-empty">Todavia no hay productos cargados en este rubro.</p>
        )}
      </article>
    </section>
  );
}
