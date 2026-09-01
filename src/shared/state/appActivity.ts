// Senal global y liviana de "la app esta en uso ahora mismo", para que
// AppUpdateNotice sepa si puede aplicar una actualizacion nueva sola (sin
// molestar) o si tiene que esperar a que el operario termine lo que esta
// haciendo. No es un context de React a proposito: no hace falta que
// nada vuelva a renderizar cuando cambia, solo que AppUpdateNotice lo
// pueda leer en el momento de decidir.
let activeUseCount = 0;

// Marca "en uso" mientras haya una venta en curso (carrito con algo
// adentro, modal de cobro abierto) -- eso es lo concreto que no hay que
// interrumpir. Cada llamador pasa una key propia para poder prender/apagar
// su propio motivo sin pisar el de otro (ej: carrito Y modal de pago al
// mismo tiempo).
const activeReasons = new Set<string>();

export function setAppBusy(reasonKey: string, isBusy: boolean) {
  const hadReason = activeReasons.has(reasonKey);
  if (isBusy && !hadReason) {
    activeReasons.add(reasonKey);
    activeUseCount += 1;
  } else if (!isBusy && hadReason) {
    activeReasons.delete(reasonKey);
    activeUseCount = Math.max(0, activeUseCount - 1);
  }
}

export function isAppIdle() {
  if (activeUseCount > 0) return false;

  // Ademas de las razones explicitas (carrito, modal), si el operario
  // esta escribiendo en cualquier campo de texto en este preciso momento
  // tampoco es un buen momento para recargar la pagina debajo suyo.
  const active = document.activeElement;
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) {
    return false;
  }

  return true;
}
