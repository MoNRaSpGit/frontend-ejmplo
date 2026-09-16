// 3 establecimientos con sus potreros -- pedido explicito (16/09/2026):
// "faltó poner potreros. En la Milagrosa del 1 al 5, en la Milonga de la
// A a la F, y en el Ombú potrero amarillo rojo verde azul negro". Todo
// esto vive SOLO en frontend-ejemplo, simulando frontend-agro sin
// tocarlo (pedido anterior, mismo dia).
export type EjemploPotrero = {
  // Nombre completo para mostrar en los select ("La Milagrosa - Potrero 3").
  label: string;
  establishmentLabel: string;
  potreroLabel: string;
  // Frases que, si aparecen en el texto, identifican este potrero --
  // varias por si el reconocimiento de voz dice el numero como digito o
  // como palabra ("potrero 3" o "potrero tres").
  matchPhrases: string[];
};

type EjemploEstablishment = {
  label: string;
  potreros: EjemploPotrero[];
};

const NUMERO_EN_PALABRAS = ["uno", "dos", "tres", "cuatro", "cinco"];

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// \b al final de una frase que termina en letra suelta (p. ej. "potrero
// a") es indispensable -- sin eso, "potrero a" matchea como substring
// adentro de "potrero amarillo" (bug real, 16/09/2026).
function phraseRegex(phrase: string, flags = ""): RegExp {
  return new RegExp(`\\b${escapeRegExp(phrase)}\\b`, flags);
}

function buildPotrero(establishmentLabel: string, potreroLabel: string, matchPhrases: string[]): EjemploPotrero {
  return {
    label: `${establishmentLabel} - Potrero ${potreroLabel}`,
    establishmentLabel,
    potreroLabel,
    matchPhrases: matchPhrases.map(normalize)
  };
}

export const EJEMPLO_ESTABLISHMENTS: EjemploEstablishment[] = [
  {
    label: "La Milagrosa",
    potreros: [1, 2, 3, 4, 5].map((n) =>
      buildPotrero("La Milagrosa", String(n), [`potrero ${n}`, `potrero ${NUMERO_EN_PALABRAS[n - 1]}`])
    )
  },
  {
    label: "La Milonga",
    potreros: ["A", "B", "C", "D", "E", "F"].map((letter) => buildPotrero("La Milonga", letter, [`potrero ${letter}`]))
  },
  {
    label: "El Ombú",
    potreros: ["Amarillo", "Rojo", "Verde", "Azul", "Negro"].map((color) =>
      buildPotrero("El Ombú", color, [`potrero ${color}`])
    )
  }
];

export const EJEMPLO_POTREROS: EjemploPotrero[] = EJEMPLO_ESTABLISHMENTS.flatMap((establishment) => establishment.potreros);

// Nombres completos, para los <select> del formulario manual.
export const EJEMPLO_FIELDS = EJEMPLO_POTREROS.map((potrero) => potrero.label);

export function findFieldInText(text: string): string | null {
  const normalizedText = normalize(text);
  for (const potrero of EJEMPLO_POTREROS) {
    if (potrero.matchPhrases.some((phrase) => phraseRegex(phrase).test(normalizedText))) {
      return potrero.label;
    }
  }
  return null;
}

// Todos los potreros mencionados, EN EL ORDEN en que aparecen en el
// texto -- para un traslado "de ORIGEN a DESTINO" alcanza con tomar el
// primero y el segundo que se nombran.
export function findAllFieldsInOrder(text: string): string[] {
  const normalizedText = normalize(text);

  const matches = EJEMPLO_POTREROS.map((potrero) => {
    const indexes = potrero.matchPhrases
      .map((phrase) => normalizedText.search(phraseRegex(phrase)))
      .filter((index) => index !== -1);
    return { label: potrero.label, index: indexes.length ? Math.min(...indexes) : -1 };
  }).filter((match) => match.index !== -1);

  matches.sort((a, b) => a.index - b.index);
  return matches.map((match) => match.label);
}

// Saca del texto las menciones a potreros ("potrero 2", "potrero
// amarillo") ANTES de buscar la cantidad o la categoria -- si no, un
// digito o una palabra-numero que en realidad es parte del nombre del
// potrero ("potrero 2", "potrero uno") se puede confundir con la
// cantidad de animales (bug real, 16/09/2026: "potrero 2" hacia que la
// cantidad diera 2 en vez del numero real dicho en la frase).
export function stripPotreroMentions(text: string): string {
  let result = normalize(text);
  for (const potrero of EJEMPLO_POTREROS) {
    for (const phrase of potrero.matchPhrases) {
      result = result.replace(phraseRegex(phrase, "g"), " ");
    }
  }
  return result;
}
