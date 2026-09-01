// Opciones de personalizacion por categoria, solo para dar un ejemplo en
// la demo (pedido explicito del usuario: "invent algun ingrediente ahi").
// Si el producto tiene una categoria que no esta en la lista, usa las
// genericas de abajo -- asi cualquier rubro nuevo que se cargue igual
// tiene algo para mostrar, sin tener que tocar codigo.
const CATEGORY_OPTIONS: Record<string, string[]> = {
  cafe: ["Canela", "Leche deslactosada", "Extra shot"],
  panaderia: ["Sin manteca", "Extra queso", "Pan integral"],
  "bebidas frias": ["Sin hielo", "Extra limon", "Menos azucar"],
  postres: ["Sin dulce de leche", "Extra chocolate", "Porcion chica"]
};

const DEFAULT_OPTIONS = ["Para llevar", "Sin sal", "Extra grande"];

export function getCustomizationOptions(category: string) {
  return CATEGORY_OPTIONS[category.trim().toLowerCase()] ?? DEFAULT_OPTIONS;
}
