// Categorias de animales, mismo espiritu que frontend-agro pero MUY
// simplificado -- esto es solo para simular el flujo de traslados aca en
// el proyecto ejemplo, sin tocar agro (pedido explicito, 16/09/2026).
type EjemploAnimalCategory = {
  label: string;
  // Frases que, si aparecen en el texto, identifican esta categoria --
  // en singular, se buscan como substring del texto ya normalizado.
  matchPhrases: string[];
};

const EJEMPLO_ANIMAL_CATEGORY_LIST: EjemploAnimalCategory[] = [
  { label: "Vaca de cría", matchPhrases: ["vaca de cria", "vacas de cria"] },
  { label: "Novillo", matchPhrases: ["novillo"] },
  { label: "Vaquillona", matchPhrases: ["vaquillona"] },
  { label: "Ternero", matchPhrases: ["ternero"] },
  { label: "Oveja", matchPhrases: ["oveja"] }
];

export const EJEMPLO_ANIMAL_CATEGORIES = EJEMPLO_ANIMAL_CATEGORY_LIST.map((category) => category.label);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function findAnimalCategoryInText(text: string): string | null {
  const normalizedText = normalize(text);
  for (const category of EJEMPLO_ANIMAL_CATEGORY_LIST) {
    if (category.matchPhrases.some((phrase) => normalizedText.includes(phrase))) {
      return category.label;
    }
  }
  return null;
}
