export function isValidCodiceFiscale(cf: string): boolean {
  return /^[A-Z0-9]{16}$/i.test(cf);
}
