// Interprete simple de comandos de voz para dar de alta un cliente
// hablando -- pedido explicito (16/09/2026): "registra a Juan numero de
// telefono 0991234567". Sin IA de por medio: busca el numero de
// telefono (una tira larga de digitos) y toma como nombre lo que hay
// entre "a" y donde arrancan esos digitos o la palabra
// "numero"/"telefono". Alcanza para esta frase fija; si el dia de
// mañana hace falta entender frases mas libres, ahi conviene sumar la
// API de Claude en vez de agrandar este regex.
export type VoiceClientCommand = {
  name: string;
  phone: string;
};

export function parseRegisterClientCommand(transcript: string): VoiceClientCommand | null {
  const cleaned = transcript.trim();
  if (!cleaned) return null;

  const digitsMatch = cleaned.match(/\d[\d\s]{5,}/);
  const phone = digitsMatch ? digitsMatch[0].replace(/\D/g, "") : "";

  // \S* (no \w*) para que "registrá" con tilde no rompa el patron -- \w
  // no incluye letras acentuadas.
  const nameMatch = cleaned.match(/registr\S*\s+a\s+([^\d]+)/i);
  if (!nameMatch) return null;

  const name = nameMatch[1]
    .replace(/\b(numero|número|tel[eé]fono|tel|con(?:\s+el)?)\b.*$/i, "")
    .replace(/[,.]+$/, "")
    .trim();

  if (!name) return null;
  return { name, phone };
}
