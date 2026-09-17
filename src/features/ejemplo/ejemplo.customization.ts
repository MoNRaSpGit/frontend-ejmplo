// Opciones de personalizacion por categoria, solo para dar un ejemplo en
// la demo (pedido explicito del usuario: "invent algun ingrediente ahi").
// Pedido explicito (16/09/2026): al elegir un rubro distinto de
// cafeteria (por ejemplo "pesca"), un producto como el rifle de aire
// comprimido mostraba las opciones de cafeteria (azucar, leche
// descremada) porque esa categoria no estaba en la lista y caia en el
// generico -- que tambien era generico "a la cafeteria". Se agregan las
// categorias de pesca y se deja el generico neutro, sin sabor a ningun
// rubro en particular, para que cualquier rubro nuevo que se cargue
// tenga algo razonable sin tener que tocar codigo.
const CATEGORY_OPTIONS: Record<string, string[]> = {
  // Cafeteria
  cafe: ["Canela", "Leche deslactosada", "Extra shot"],
  panaderia: ["Sin manteca", "Extra queso", "Pan integral"],
  "bebidas frias": ["Sin hielo", "Extra limon", "Menos azucar"],
  postres: ["Sin dulce de leche", "Extra chocolate", "Porcion chica"],
  // Pesca
  cañas: ["Con funda protectora", "Anillas de repuesto", "Con estuche rigido"],
  reeles: ["Con aceite lubricante", "Cordon extra", "Con funda"],
  "aire comprimido": ["Con mira laser", "Con funda", "Balines de regalo"],
  accesorios: ["Empaque para regalo", "Set completo", "Version reforzada"],
  indumentaria: ["Talle S", "Talle M", "Talle L"],
  carnada: ["Surtido de colores", "Extra brillante", "Resistente al agua"]
};

const DEFAULT_OPTIONS = ["Envio express", "Con garantia extendida", "Empaque para regalo"];

export function getCustomizationOptions(category: string) {
  return CATEGORY_OPTIONS[category.trim().toLowerCase()] ?? DEFAULT_OPTIONS;
}
