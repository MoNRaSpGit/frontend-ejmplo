import { useEffect, useState } from "react";
import {
  clearPreferredPrinterName,
  getPrintMethod,
  listQzPrinters,
  setPreferredPrinterName,
  setPrintMethod,
  type PrintMethod
} from "../services/ejemplo.print";
import { getCachedUsbPrinterName, isWebUsbSupported, pickUsbPrinter } from "../services/ejemplo.webusbPrint";

type PrinterSettingsModalProps = {
  currentPrinterName: string | null;
  onClose: () => void;
  onPrinterChange: (name: string | null) => void;
};

// Dos formas de imprimir: "PC" via QZ Tray, o "Tablet / Celular" directo
// por USB sin QZ de por medio (QZ Tray no corre en Android). Arranca
// adivinada segun el dispositivo (ver guessDefaultPrintMethod en
// ejemplo.print.ts) pero el operario la puede cambiar a mano aca, y esa
// eleccion manual queda guardada para siempre.
export function PrinterSettingsModal({ currentPrinterName, onClose, onPrinterChange }: PrinterSettingsModalProps) {
  const [method, setMethod] = useState<PrintMethod>(getPrintMethod());
  const [printers, setPrinters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(() => getCachedUsbPrinterName());
  const [isPickingUsb, setIsPickingUsb] = useState(false);

  useEffect(() => {
    if (method !== "qz") return;
    let active = true;

    async function loadPrinters() {
      setIsLoading(true);
      setError("");
      try {
        const found = await listQzPrinters();
        if (active) setPrinters(found);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? `No se pudo conectar a QZ Tray: ${loadError.message}`
              : "No se pudo conectar a QZ Tray. Revisa que este abierto."
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadPrinters();
    return () => {
      active = false;
    };
  }, [method]);

  function handleChangeMethod(nextMethod: PrintMethod) {
    setMethod(nextMethod);
    setPrintMethod(nextMethod);
    setError("");
  }

  function handleSelect(name: string) {
    setPreferredPrinterName(name);
    onPrinterChange(name);
    onClose();
  }

  function handleForget() {
    clearPreferredPrinterName();
    onPrinterChange(null);
  }

  async function handlePickUsbPrinter() {
    setIsPickingUsb(true);
    setError("");
    try {
      const name = await pickUsbPrinter();
      setUsbDeviceName(name);
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : "No se pudo conectar la impresora USB.");
    } finally {
      setIsPickingUsb(false);
    }
  }

  return (
    <div className="ejemplo-modal" role="presentation" onClick={onClose}>
      <div className="ejemplo-modal__backdrop" />
      <article className="ejemplo-modal__dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Impresora</h2>

        <div className="ejemplo-payment-chips">
          <button
            type="button"
            className={`ejemplo-chip ${method === "qz" ? "is-selected" : ""}`}
            onClick={() => handleChangeMethod("qz")}
          >
            PC
          </button>
          <button
            type="button"
            className={`ejemplo-chip ${method === "webusb" ? "is-selected" : ""}`}
            onClick={() => handleChangeMethod("webusb")}
          >
            Tablet / Celular
          </button>
        </div>

        {method === "qz" ? (
          <>
            <p className="ejemplo-hint">
              {currentPrinterName ? (
                <>
                  Usando ahora: <strong>{currentPrinterName}</strong>
                </>
              ) : (
                "Todavia no elegiste ninguna impresora."
              )}
            </p>

            {isLoading ? <p className="ejemplo-empty">Buscando impresoras (QZ Tray)...</p> : null}
            {error ? <p className="ejemplo-empty">{error}</p> : null}

            {!isLoading && !error ? (
              printers.length ? (
                <ul className="ejemplo-printer-list">
                  {printers.map((printer) => (
                    <li key={printer}>
                      <button
                        type="button"
                        className={`ejemplo-printer-option ${printer === currentPrinterName ? "is-active" : ""}`}
                        onClick={() => handleSelect(printer)}
                      >
                        {printer}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ejemplo-empty">QZ Tray no detecto ninguna impresora instalada.</p>
              )
            ) : null}
          </>
        ) : (
          <>
            <p className="ejemplo-hint">
              {usbDeviceName ? (
                <>
                  Usando ahora: <strong>{usbDeviceName}</strong>
                </>
              ) : (
                "Todavia no elegiste ninguna impresora USB."
              )}
            </p>

            {!isWebUsbSupported() ? (
              <p className="ejemplo-empty">Este navegador no soporta USB directo (probalo con Chrome en Android).</p>
            ) : (
              <>
                <p className="ejemplo-hint">Conecta la impresora termica por USB a la tablet o celular antes de elegirla.</p>
                {error ? <p className="ejemplo-empty">{error}</p> : null}
                <button
                  type="button"
                  className="ejemplo-button ejemplo-button--ghost"
                  onClick={() => void handlePickUsbPrinter()}
                  disabled={isPickingUsb}
                >
                  {isPickingUsb ? "Buscando..." : usbDeviceName ? "Cambiar impresora USB" : "Elegir impresora USB"}
                </button>
              </>
            )}
          </>
        )}

        <div className="ejemplo-modal__footer">
          {method === "qz" && currentPrinterName ? (
            <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={handleForget}>
              Olvidar impresora
            </button>
          ) : null}
          <button type="button" className="ejemplo-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </article>
    </div>
  );
}
