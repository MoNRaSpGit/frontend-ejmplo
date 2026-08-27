// Comandos ESC/POS crudos (control de la impresora termica) + helpers de
// formato para armar el ticket. Copia propia de frontend-ejemplo, inspirada
// en el motor de tickets de joker pero sin compartir codigo entre proyectos.

export const TICKET_WIDTH = 48;

const DECORATIVE_CHAR = "=";
const DIVIDER_CHAR = "-";

export function decorativeBorder() {
  return DECORATIVE_CHAR.repeat(TICKET_WIDTH);
}

export function divider() {
  return DIVIDER_CHAR.repeat(TICKET_WIDTH);
}

export function formatMoney(amount: number) {
  const rounded = Math.round(amount * 100) / 100;
  const value = Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2).replace(".", ",");
  return `$ ${value}`;
}

// Linea con el label a la izquierda y el valor pegado a la derecha,
// rellenando el medio con espacios.
export function rightAlignedLine(label: string, value: string) {
  const gap = Math.max(1, TICKET_WIDTH - label.length - value.length);
  return `${label}${" ".repeat(gap)}${value}`;
}

export const ESC_INIT = "\x1B\x40";
export const ALIGN_CENTER = "\x1B\x61\x01";
export const ALIGN_LEFT = "\x1B\x61\x00";
export const BOLD_ON = "\x1B\x45\x01";
export const BOLD_OFF = "\x1B\x45\x00";
export const DOUBLE_SIZE_ON = "\x1D\x21\x11";
export const DOUBLE_SIZE_OFF = "\x1D\x21\x00";
// Solo mas alto, ancho normal: unico paso intermedio entre normal y doble.
export const TALL_SIZE_ON = "\x1D\x21\x01";
export const CUT_PAPER = "\x1D\x56\x41\x00";
