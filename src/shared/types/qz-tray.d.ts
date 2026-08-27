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
  };
  export default qz;
}
