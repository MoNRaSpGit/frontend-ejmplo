import { useEffect, useRef, useState } from "react";
import { fetchPublishedFrontendBuildMeta, FRONTEND_BUILD_INFO } from "../config/build";

const UPDATE_CHECK_INTERVAL_MS = 2 * 60 * 1000;

export function AppUpdateNotice() {
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  // Guarda la funcion que devuelve registerSW() -- llamarla con true hace
  // que el service worker nuevo tome el control (skipWaiting) y recien
  // ahi recarga la pagina. Antes se hacia un window.location.reload() a
  // ciegas: si el service worker todavia no habia terminado de instalar
  // la version nueva, el reload volvia a servir el cache viejo y el
  // cartel de "hay una version nueva" seguia apareciendo -- por eso habia
  // que apretar "Actualizar" varias veces.
  const updateSwRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD) {
      setShow(false);
      return;
    }

    let cancelled = false;

    import("virtual:pwa-register")
      .then(({ registerSW }) => {
        if (cancelled) return;
        updateSwRef.current = registerSW({
          onNeedRefresh() {
            setShow(true);
          }
        });
      })
      .catch(() => {
        // Si el modulo del service worker no carga (ej: navegador viejo),
        // el aviso via app-build.json de mas abajo sigue funcionando
        // igual, solo que el boton termina haciendo un reload comun.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD) {
      return;
    }

    let mounted = true;
    const checkForUpdates = async () => {
      try {
        const published = await fetchPublishedFrontendBuildMeta();
        if (!mounted) return;
        if (published.releaseSha !== FRONTEND_BUILD_INFO.releaseSha) {
          setShow(true);
        }
      } catch {
        // Silencioso: si esta llamada falla, el aviso via el service
        // worker (onNeedRefresh) sigue siendo la fuente principal.
      }
    };

    void checkForUpdates();
    const intervalId = window.setInterval(() => {
      void checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void checkForUpdates();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  async function handleUpdate() {
    setIsUpdating(true);
    try {
      if (updateSwRef.current) {
        // reloadPage=true: espera a que el nuevo service worker tome el
        // control y recien ahi recarga -- un solo click alcanza.
        await updateSwRef.current(true);
        return;
      }
    } catch {
      // Si algo falla, cae al reload comun de abajo.
    }
    window.location.reload();
  }

  if (!show) {
    return null;
  }

  return (
    <aside style={noticeStyle}>
      <strong>Hay una version nueva disponible.</strong>
      <button type="button" onClick={() => void handleUpdate()} disabled={isUpdating} style={buttonStyle}>
        {isUpdating ? "Actualizando..." : "Actualizar"}
      </button>
    </aside>
  );
}

const noticeStyle: React.CSSProperties = {
  position: "fixed",
  left: 16,
  bottom: 16,
  zIndex: 30,
  padding: "12px 14px",
  borderRadius: 18,
  background: "#14213d",
  color: "#fff",
  display: "flex",
  gap: 12,
  alignItems: "center",
  boxShadow: "0 16px 30px rgba(0,0,0,0.16)"
};

const buttonStyle: React.CSSProperties = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: 999,
  border: "none",
  fontWeight: 800,
  cursor: "pointer"
};
