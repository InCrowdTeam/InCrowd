export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

// Helpers for common HTTP errors
export const BadRequest = (message = "Dati non validi") => new AppError(message, 400);
export const Unauthorized = (message = "Utente non autenticato") => new AppError(message, 401);
export const Forbidden = (message = "Accesso negato") => new AppError(message, 403);
export const NotFound = (message = "Risorsa non trovata") => new AppError(message, 404);
export const Conflict = (message = "Conflitto") => new AppError(message, 409);
export const InternalError = (message = "Errore interno del server") => new AppError(message, 500);


