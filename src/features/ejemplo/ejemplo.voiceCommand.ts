// Interprete simple de comandos de voz para dar de alta un cliente
// hablando -- pedido explicito (16/09/2026): "registra a Juan numero de
// telefono 0991234567". Sin IA de por medio: busca el numero de
// telefono (una tira de digitos) y toma como nombre lo que hay despues
// de "registrá (a/al/el/la) (cliente/clienta)" hasta donde arrancan
// esos digitos o alguna palabra tipo "numero"/"telefono". Alcanza para
// frases con esta forma; si el dia de mañana hace falta entender
// frases mas libres, ahi conviene sumar la API de Claude en vez de
// agrandar este regex.
export type VoiceClientCommand = {
  name: string;
  phone: string;
};

export function parseRegisterClientCommand(transcript: string): VoiceClientCommand | null {
  const cleaned = transcript.trim();
  if (!cleaned) return null;

  // 3 digitos o mas (numeros de prueba cortos tipo "123" tienen que
  // reconocerse igual que un numero real).
  const digitsMatch = cleaned.match(/\d[\d\s]{2,}/);
  const phone = digitsMatch ? digitsMatch[0].replace(/\D/g, "") : "";

  // \S* (no \w*) para que "registrá" con tilde no rompa el patron -- \w
  // no incluye letras acentuadas. El grupo de preposiciones (a/al/el/la)
  // se repite hasta 2 veces para bancar "a la clienta Ana" ademas de
  // "a Juan" o "al cliente Pedro".
  const nameMatch = cleaned.match(/registr\S*\s+(?:(?:a|al|el|la)\s+){0,2}(?:client[ae]\s+)?([^\d]+)/i);
  if (!nameMatch) return null;

  const name = nameMatch[1]
    .replace(/\b(numero|número|tel[eé]fono|tel|con(?:\s+el)?)\b.*$/i, "")
    .replace(/[,.]+$/, "")
    .trim();

  if (!name) return null;
  return { name, phone };
}
