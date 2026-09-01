// Tipos minimos de qz-tray para este proyecto: solo lo que usa
// ejemplo.print.ts. Copia propia (frontend-ejemplo no comparte codigo con
// otros proyectos del monorepo).
declare module "qz-tray" {
  const qz: {
    websocket: {
      isActive: () => boolean;
      connect: () => Promise<void>;
    };
    printers: {
      find: () => Promise<string[]>;
    };
    configs: {
      create: (printer: string, options?: Record<string, unknown>) => unknown;
    };
    print: (config: unknown, data: string[]) => Promise<void>;
    security: {
      setCertificatePromise: (
        promiseHandler: (resolve: (certificate: string) => void, reject: (error: unknown) => void) => void
      ) => void;
      setSignatureAlgorithm: (algorithm: "SHA1" | "SHA256" | "SHA512") => void;
      setSignaturePromise: (
        promiseFactory: (
          toSign: string
        ) => (resolve: (signature: string) => void, reject: (error: unknown) => void) => void
      ) => void;
    };
  };
  export default qz;
}
