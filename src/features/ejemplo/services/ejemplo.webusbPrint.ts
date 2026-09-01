// Impresion directa por WebUSB (sin QZ Tray de por medio): lo que usamos
// para tablets Android, donde no hay forma de instalar un programa de
// escritorio como QZ. Misma idea que ya probamos en frontend-piloto,
// adaptada para mandar lineas ESC/POS crudas (las mismas que arma
// ejemplo.ticketFormat.ts para QZ) en vez de un objeto de ticket propio.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- WebUSB no tiene tipos oficiales en TS.
type UsbDeviceLike = any;
type UsbPrinterPath = {
  interfaceNumber: number;
  alternateSetting: number;
  endpointNumber: number;
};

type UsbNavigatorLike = Navigator & {
  usb?: {
    getDevices(): Promise<UsbDeviceLike[]>;
    requestDevice(options: { filters: Array<Record<string, number>> }): Promise<UsbDeviceLike>;
  };
};

let cachedUsbPrinter: UsbDeviceLike | null = null;
let cachedUsbPath: UsbPrinterPath | null = null;

const COMBINING_DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function getUsbApi() {
  if (typeof navigator === "undefined") {
    return null;
  }

  return (navigator as UsbNavigatorLike).usb ?? null;
}

export function isWebUsbSupported() {
  return getUsbApi() !== null;
}

// WebUSB manda los bytes crudos a la impresora, sin un encoding como CP437
// de por medio: sacamos acentos para que cada caracter entre en un byte.
function stripAccents(value: string) {
  return value.normalize("NFD").replace(COMBINING_DIACRITICS_REGEX, "");
}

function encodeAsBytes(text: string) {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function findUsbPrinterPath(device: UsbDeviceLike): UsbPrinterPath | null {
  const configuration = device?.configuration ?? device?.configurations?.[0] ?? null;
  const interfaces = configuration?.interfaces ?? [];

  for (const usbInterface of interfaces) {
    const alternates = usbInterface?.alternates ?? [];
    for (const alternate of alternates) {
      const endpoints = alternate?.endpoints ?? [];
      const outEndpoint = endpoints.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- WebUSB no tiene tipos oficiales en TS.
        (endpoint: any) => endpoint?.direction === "out" || endpoint?.type === "bulk" || endpoint?.endpointType === "bulk"
      );

      if (!outEndpoint) {
        continue;
      }

      return {
        interfaceNumber: Number(usbInterface?.interfaceNumber ?? usbInterface?.interface ?? 0),
        alternateSetting: Number(alternate?.alternateSetting ?? alternate?.alternate ?? 0),
        endpointNumber: Number(outEndpoint?.endpointNumber ?? outEndpoint?.endpoint ?? outEndpoint?.address ?? 0)
      };
    }
  }

  return null;
}

function pickAuthorizedUsbPrinter(devices: UsbDeviceLike[]) {
  const list = Array.isArray(devices) ? devices : [];
  if (!list.length) {
    return null;
  }

  const named = list.find((device) => {
    const label = `${device?.manufacturerName || ""} ${device?.productName || ""}`.toLowerCase();
    return /xprinter|xp-|thermal|receipt|pos/i.test(label);
  });

  return named || list[0] || null;
}

async function connectPrinter(device: UsbDeviceLike) {
  if (!device) {
    throw new Error("No se pudo acceder a la impresora USB.");
  }

  if (!device.opened) {
    await device.open();
  }

  if (device.configuration == null) {
    const configurationValue = device?.configurations?.[0]?.configurationValue ?? 1;
    await device.selectConfiguration(configurationValue);
  }

  const path = cachedUsbPath ?? findUsbPrinterPath(device);
  if (!path) {
    throw new Error("No encontramos un endpoint USB de salida para la impresora.");
  }

  try {
    await device.claimInterface(path.interfaceNumber);
  } catch {
    // Si ya estaba reclamada por una sesion previa, seguimos.
  }

  if (path.alternateSetting > 0 && typeof device.selectAlternateInterface === "function") {
    try {
      await device.selectAlternateInterface(path.interfaceNumber, path.alternateSetting);
    } catch {
      // Algunos dispositivos no exponen alternates seleccionables.
    }
  }

  cachedUsbPath = path;
  return { device, path };
}

// Se llama al montar la app: getDevices() no pide permiso, solo lista
// impresoras ya autorizadas en una sesion anterior desde este navegador.
export async function primeUsbPrinterConnection() {
  const usb = getUsbApi();
  if (!usb) {
    return null;
  }

  try {
    const devices = await usb.getDevices();
    cachedUsbPrinter = pickAuthorizedUsbPrinter(devices);
    return cachedUsbPrinter;
  } catch {
    return null;
  }
}

export function getCachedUsbPrinterName() {
  return cachedUsbPrinter?.productName || cachedUsbPrinter?.manufacturerName || null;
}

// Abre el picker nativo de USB para elegir/autorizar la impresora --
// requiere gesto del usuario (click), se usa desde el boton "Elegir
// impresora USB" en la configuracion, no automatico.
export async function pickUsbPrinter() {
  const usb = getUsbApi();
  if (!usb) {
    throw new Error("WebUSB no esta disponible en este navegador.");
  }

  cachedUsbPrinter = await usb.requestDevice({ filters: [{ classCode: 7 }] });
  cachedUsbPath = null;
  return getCachedUsbPrinterName();
}

export async function printRawLinesByWebUsb(lines: string[]) {
  const usb = getUsbApi();
  if (!usb) {
    throw new Error("WebUSB no esta disponible en este navegador.");
  }

  if (!cachedUsbPrinter) {
    throw new Error('Todavia no elegiste una impresora USB. Toca "Impresora" para elegirla.');
  }

  const sanitizedLines = lines.map((line) => stripAccents(line));
  const { device, path } = await connectPrinter(cachedUsbPrinter);

  try {
    for (const line of sanitizedLines) {
      if (!line) continue;
      await device.transferOut(path.endpointNumber, encodeAsBytes(line));
    }
  } catch (error) {
    cachedUsbPrinter = null;
    cachedUsbPath = null;
    try {
      await device.close();
    } catch {
      // Ignoramos el cierre si el dispositivo ya se desconecto.
    }

    throw error;
  }

  return { deviceName: getCachedUsbPrinterName() || "USB printer" };
}
