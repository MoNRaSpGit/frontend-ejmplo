// Interprete de comandos de voz para traslados entre campos -- pedido
// explicito (16/09/2026): "haceme un traslado de vaca de cría, de cinco
// vacas de cría, de La Milagrosa a el Ombú". Simula lo que hace
// frontend-agro (traslados entre potreros), pero vive SOLO en
// frontend-ejemplo, sin tocar agro para nada.
import { findAnimalCategoryInText } from "./ejemplo.animalCategories";
import { findAllFieldsInOrder, stripPotreroMentions } from "./ejemplo.fields";
import { findNumberInText } from "./ejemplo.spanishNumbers";

export type VoiceTransferCommand = {
  quantity: number;
  category: string;
  origin: string;
  destination: string;
};

export function parseTransferCommand(transcript: string): VoiceTransferCommand | null {
  const cleaned = transcript.trim();
  if (!cleaned) return null;

  // Los potreros se buscan en el texto ORIGINAL (para saber el orden:
  // origen primero, destino segundo). La cantidad y la categoria se
  // buscan en una copia SIN esas menciones -- si no, "potrero 2" o
  // "potrero uno" pueden confundirse con la cantidad de animales real
  // dicha en otra parte de la frase.
  const [origin, destination] = findAllFieldsInOrder(cleaned);
  const textWithoutPotreros = stripPotreroMentions(cleaned);

  const quantity = findNumberInText(textWithoutPotreros);
  const category = findAnimalCategoryInText(textWithoutPotreros);

  if (!quantity || !category || !origin || !destination || origin === destination) {
    return null;
  }

  return { quantity, category, origin, destination };
}
