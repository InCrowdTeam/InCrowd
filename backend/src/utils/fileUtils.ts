export function ensureBase64FromBufferData(
  maybeBufferData: unknown
): string | undefined {
  if (!maybeBufferData) return undefined;
  try {
    if (Buffer.isBuffer(maybeBufferData)) {
      return maybeBufferData.toString("base64");
    }
    if (typeof maybeBufferData === "string") {
      return maybeBufferData;
    }
    // Attempt typed array → base64
    if (Array.isArray(maybeBufferData)) {
      const bytes = new Uint8Array(maybeBufferData as any);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return Buffer.from(binary, "binary").toString("base64");
    }
  } catch {
    return undefined;
  }
  return undefined;
}


