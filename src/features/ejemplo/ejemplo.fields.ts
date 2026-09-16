// 3 campos fijos de prueba (16/09/2026) -- pedido explicito: "simular lo
// que hacemos en agro sin tocar agro". Todo esto vive SOLO en
// frontend-ejemplo, no tiene nada que ver con el proyecto frontend-agro
// real.
type EjemploField = {
  label: string;
  // Solo el nombre propio, sin articulo -- para reconocerlo aunque se
  // diga "al Ombu" (contraccion de "a"+"el", no contiene "el Ombu" como
  // substring literal).
  matchKey: string;
};

const EJEMPLO_FIELD_LIST: EjemploField[] = [
  { label: "La Milagrosa", matchKey: "milagrosa" },
  { label: "La Milonga", matchKey: "milonga" },
  { label: "El Ombú", matchKey: "ombu" }
];

export const EJEMPLO_FIELDS = EJEMPLO_FIELD_LIST.map((field) => field.label);

// Sin tilde y en minuscula, para reconocer el campo aunque el
// reconocimiento de voz no ponga el acento ("ombu" en vez de "Ombú").
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function findFieldInText(text: string): string | null {
  const normalizedText = normalize(text);
  for (const field of EJEMPLO_FIELD_LIST) {
    if (normalizedText.includes(field.matchKey)) {
      return field.label;
    }
  }
  return null;
}

// Todos los campos mencionados, EN EL ORDEN en que aparecen en el texto
// -- para un traslado "de ORIGEN a DESTINO" alcanza con tomar el primero
// y el segundo que se nombran.
export function findAllFieldsInOrder(text: string): string[] {
  const normalizedText = normalize(text);
  const matches = EJEMPLO_FIELD_LIST.map((field) => ({
    label: field.label,
    index: normalizedText.indexOf(field.matchKey)
  })).filter((match) => match.index !== -1);

  matches.sort((a, b) => a.index - b.index);
  return matches.map((match) => match.label);
}
