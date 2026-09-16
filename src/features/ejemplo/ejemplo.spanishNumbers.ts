// Convierte un numero dicho en palabras ("cinco", "treinta y dos") a
// numero -- el reconocimiento de voz devuelve el numero como palabra, no
// como digito, asi que hace falta esto para "cinco vacas" (16/09/2026).
const UNITS: Record<string, number> = {
  cero: 0,
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  veintiuno: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29
};

const TENS: Record<string, number> = {
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Busca el PRIMER numero (digito o palabra) en el texto. Bandea
// "treinta y dos" (tens + "y" + unidad) ademas de los numeros sueltos.
export function findNumberInText(text: string): number | null {
  const digitMatch = text.match(/\d+/);
  if (digitMatch) return Number(digitMatch[0]);

  const words = normalize(text).split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // "un/una traslado" es una muletilla ("haceme UN traslado de...."),
    // no la cantidad de animales -- se saltea para no confundirlo con
    // el numero de verdad que viene mas adelante en la frase.
    if ((word === "un" || word === "una") && words[i + 1]?.startsWith("trasl")) {
      continue;
    }

    if (word in TENS) {
      const next = words[i + 1];
      const nextNext = words[i + 2];
      if (next === "y" && nextNext && nextNext in UNITS) {
        return TENS[word] + UNITS[nextNext];
      }
      return TENS[word];
    }
    if (word in UNITS) {
      return UNITS[word];
    }
  }
  return null;
}
