// Interprete de comandos de voz para traslados entre campos -- pedido
// explicito (16/09/2026): "haceme un traslado de vaca de cría, de cinco
// vacas de cría, de La Milagrosa a el Ombú". Simula lo que hace
// frontend-agro (traslados entre potreros), pero vive SOLO en
// frontend-ejemplo, sin tocar agro para nada.
import { findAnimalCategoryInText } from "./ejemplo.animalCategories";
import { findAllFieldsInOrder } from "./ejemplo.fields";
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

  const quantity = findNumberInText(cleaned);
  const category = findAnimalCategoryInText(cleaned);
  const [origin, destination] = findAllFieldsInOrder(cleaned);

  if (!quantity || !category || !origin || !destination || origin === destination) {
    return null;
  }

  return { quantity, category, origin, destination };
}
