import { useEffect, useState } from "react";
import { clearPreferredPrinterName, listQzPrinters, setPreferredPrinterName } from "../services/ejemplo.print";

type PrinterSettingsModalProps = {
  currentPrinterName: string | null;
  onClose: () => void;
  onPrinterChange: (name: string | null) => void;
};

export function PrinterSettingsModal({ currentPrinterName, onClose, onPrinterChange }: PrinterSettingsModalProps) {
  const [printers, setPrinters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, []);

  function handleSelect(name: string) {
    setPreferredPrinterName(name);
    onPrinterChange(name);
    onClose();
  }

  function handleForget() {
    clearPreferredPrinterName();
    onPrinterChange(null);
  }

  return (
    <div className="ejemplo-modal" role="presentation" onClick={onClose}>
      <div className="ejemplo-modal__backdrop" />
      <article className="ejemplo-modal__dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Impresora</h2>
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

        <div className="ejemplo-modal__footer">
          {currentPrinterName ? (
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
