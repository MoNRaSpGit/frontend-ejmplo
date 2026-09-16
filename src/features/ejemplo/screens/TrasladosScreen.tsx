import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { EJEMPLO_ANIMAL_CATEGORIES } from "../ejemplo.animalCategories";
import { EJEMPLO_FIELDS } from "../ejemplo.fields";
import { parseTransferCommand, type VoiceTransferCommand } from "../ejemplo.voiceTransfer";

// Reconocimiento de voz del navegador -- mismo criterio que
// ClientesScreen.tsx (Web Speech API, gratis, sin servicios de
// terceros).
type SpeechRecognitionResultLike = { transcript: string };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function createSpeechRecognition(): SpeechRecognitionLike | null {
  const w = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

type TransferRecord = VoiceTransferCommand & { id: string; timeLabel: string };

function formatNow(): string {
  return new Date().toLocaleString("es-UY", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// Traslados entre campos, simulando frontend-agro -- pedido explicito
// (16/09/2026): "es como para simular lo que hacemos en agro sin tocar
// agro". Todo vive en memoria (se resetea al recargar), no hay backend
// para esto todavia -- es solo para probar el flujo de voz +
// confirmacion.
export function TrasladosScreen() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [form, setForm] = useState({
    quantity: "",
    category: EJEMPLO_ANIMAL_CATEGORIES[0],
    origin: EJEMPLO_FIELDS[0],
    destination: EJEMPLO_FIELDS[1]
  });
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [pendingCommand, setPendingCommand] = useState<VoiceTransferCommand | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  function addTransfer(command: VoiceTransferCommand) {
    setTransfers((current) => [{ ...command, id: `t-${Date.now()}`, timeLabel: formatNow() }, ...current]);
  }

  function handleManualSubmit() {
    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("Ingresá una cantidad válida.");
      return;
    }
    if (form.origin === form.destination) {
      toast.error("El campo de origen y destino no pueden ser el mismo.");
      return;
    }

    addTransfer({ quantity, category: form.category, origin: form.origin, destination: form.destination });
    setForm((current) => ({ ...current, quantity: "" }));
    toast.success("Traslado registrado.");
  }

  function handleToggleVoice() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) {
      toast.error("Tu navegador no permite reconocimiento de voz. Probá con Chrome.");
      return;
    }

    recognition.lang = "es-UY";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setLastHeard(transcript);

      const command = parseTransferCommand(transcript);
      if (!command) {
        toast.error(
          `No entendí ese traslado: "${transcript}". Probá decir "Traslado de [cantidad] [categoría] de [campo] a [campo]".`
        );
        return;
      }

      // No se guarda directo -- pedido explicito: "que salte un modal...
      // y ahi vos solo tengas que apretar aceptar".
      setPendingCommand(command);
    };

    recognition.onerror = () => {
      toast.error("No se pudo escuchar bien. Probá de nuevo.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    setLastHeard("");
    recognition.start();
  }

  function handleConfirmPending() {
    if (!pendingCommand) return;
    addTransfer(pendingCommand);
    setPendingCommand(null);
    toast.success("Traslado registrado.");
  }

  return (
    <section className="ejemplo-screen">
      <article className="ejemplo-panel">
        <h2>Traslados entre campos</h2>
        <p className="ejemplo-hint">
          Simulacro de traslados de animales entre campos (como en frontend-agro, pero solo para probar acá) -- campos
          fijos: {EJEMPLO_FIELDS.join(", ")}.
        </p>

        <div className="ejemplo-toolbar">
          <button
            type="button"
            className={isListening ? "ejemplo-button ejemplo-button--voice is-listening" : "ejemplo-button ejemplo-button--voice"}
            onClick={handleToggleVoice}
          >
            {isListening ? "Escuchando..." : "Decir traslado"}
          </button>
        </div>
        {lastHeard ? <p className="ejemplo-hint">Escuché: "{lastHeard}"</p> : null}

        <div className="ejemplo-form-grid">
          <label className="ejemplo-field">
            <span>Cantidad</span>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
            />
          </label>
          <label className="ejemplo-field">
            <span>Categoría</span>
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              {EJEMPLO_ANIMAL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="ejemplo-field">
            <span>Origen</span>
            <select value={form.origin} onChange={(event) => setForm((current) => ({ ...current, origin: event.target.value }))}>
              {EJEMPLO_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </label>
          <label className="ejemplo-field">
            <span>Destino</span>
            <select
              value={form.destination}
              onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))}
            >
              {EJEMPLO_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={handleManualSubmit}>
          + Registrar traslado
        </button>

        <div className="ejemplo-entries-list">
          {transfers.map((transfer) => (
            <div key={transfer.id} className="ejemplo-entry-row">
              <span>{transfer.timeLabel}</span>
              <span>
                {transfer.quantity} {transfer.category}
              </span>
              <strong>
                {transfer.origin} → {transfer.destination}
              </strong>
            </div>
          ))}
          {!transfers.length ? <p className="ejemplo-empty">Todavía no se registró ningún traslado.</p> : null}
        </div>
      </article>

      {pendingCommand ? (
        <div className="ejemplo-modal" role="presentation" onClick={() => setPendingCommand(null)}>
          <div className="ejemplo-modal__backdrop" />
          <article className="ejemplo-modal__dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Confirmar traslado</h2>
            <p className="ejemplo-hint">
              ¿Querés hacer un traslado de <strong>{pendingCommand.quantity}</strong> <strong>{pendingCommand.category}</strong>{" "}
              de <strong>{pendingCommand.origin}</strong> a <strong>{pendingCommand.destination}</strong>?
            </p>

            <div className="ejemplo-modal__footer">
              <button type="button" className="ejemplo-button ejemplo-button--ghost" onClick={() => setPendingCommand(null)}>
                Cancelar
              </button>
              <button type="button" className="ejemplo-button" onClick={handleConfirmPending}>
                Aceptar
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
