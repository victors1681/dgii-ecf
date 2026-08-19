import axios from 'axios';
import { Mensaje } from './types';

/**
 * Maximum number of characters kept from a response body that could not be
 * reduced to a human readable message. Keeps the error usable in logs and in
 * the tracking records without dumping a whole HTML page.
 */
const MAX_RAW_LENGTH = 1000;

export interface DgiiApiErrorContext {
  /** Resource path that was requested, e.g. `/TesteCF/autenticacion/...`. */
  resource?: string;
  /** HTTP method used for the request. */
  method?: string;
  /** Base url used for the request. */
  baseURL?: string;
  /**
   * Message to use when DGII did not return any description in the body.
   * Defaults to the HTTP status / axios message.
   */
  fallbackMessage?: string;
}

interface DgiiApiErrorOptions extends DgiiApiErrorContext {
  status?: number;
  statusText?: string;
  code?: string;
  data?: unknown;
  mensajes?: Mensaje[];
  cause?: unknown;
}

const truncate = (value: string): string =>
  value.length > MAX_RAW_LENGTH ? `${value.slice(0, MAX_RAW_LENGTH)}…` : value;

const collapseWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const looksLikeHtml = (value: string): boolean =>
  /^\s*<(?:!doctype|html|body|head)\b/i.test(value);

const stripHtml = (value: string): string =>
  collapseWhitespace(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  );

/**
 * DGII returns `mensajes` either as `{ valor, codigo }` objects or as plain
 * strings depending on the service, so both shapes are normalized here.
 */
const readMensajes = (value: unknown): Mensaje[] | undefined => {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  const mensajes = value
    .map((item): Mensaje | undefined => {
      if (typeof item === 'string' && item.trim()) {
        return { valor: item.trim(), codigo: 0 };
      }
      if (isPlainObject(item) && typeof item.valor === 'string') {
        return {
          valor: item.valor,
          codigo: typeof item.codigo === 'number' ? item.codigo : 0,
        };
      }
      return undefined;
    })
    .filter((item): item is Mensaje => item !== undefined);

  return mensajes.length ? mensajes : undefined;
};

/**
 * Keys DGII (and the ASP.NET stack behind it) uses to carry the error
 * description, in the order they should be preferred.
 */
const MESSAGE_KEYS = [
  'mensaje',
  'Mensaje',
  'message',
  'Message',
  'error',
  'Error',
  'errorMessage',
  'error_description',
  'detail',
  'Detail',
  'title',
  'Title',
  'descripcion',
  'Descripcion',
];

/**
 * Extract the human readable error DGII sent in the response body.
 *
 * The DGII services are inconsistent: an authentication failure comes back as
 * a bare string (`"El RNC 40247764232 del certificado no está delegado para
 * realizar transaciones."`), other endpoints answer with `{ mensajes: [...] }`,
 * with an ASP.NET `ProblemDetails`/`ModelState` payload, or with an HTML error
 * page. Every one of those shapes is reduced to a single string here so the
 * caller never has to fall back to the generic axios message.
 */
export const extractDgiiErrorMessage = (data: unknown): string | undefined => {
  if (data === undefined || data === null) {
    return undefined;
  }

  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) {
      return undefined;
    }

    // Some services answer with a JSON encoded body but a text/plain content
    // type, so axios hands over the raw string instead of the parsed value.
    if (/^[[{"]/.test(trimmed)) {
      try {
        return extractDgiiErrorMessage(JSON.parse(trimmed));
      } catch {
        // Not JSON after all, fall through and use the raw text.
      }
    }

    if (looksLikeHtml(trimmed)) {
      const text = stripHtml(trimmed);
      return text ? truncate(text) : undefined;
    }

    return truncate(collapseWhitespace(trimmed));
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  if (Buffer.isBuffer(data)) {
    return extractDgiiErrorMessage(data.toString('utf8'));
  }

  if (data instanceof Uint8Array) {
    return extractDgiiErrorMessage(Buffer.from(data).toString('utf8'));
  }

  if (data instanceof Error) {
    return data.message || undefined;
  }

  if (Array.isArray(data)) {
    const parts = data
      .map((item) => extractDgiiErrorMessage(item))
      .filter((item): item is string => !!item);
    return parts.length ? truncate(parts.join(' | ')) : undefined;
  }

  if (isPlainObject(data)) {
    const mensajes = readMensajes(data.mensajes ?? data.Mensajes);
    if (mensajes) {
      return truncate(mensajes.map((mensaje) => mensaje.valor).join(' | '));
    }

    for (const key of MESSAGE_KEYS) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) {
        return truncate(collapseWhitespace(value));
      }
      // ProblemDetails nests the validation errors under `errors`.
      if (key === 'error' && (isPlainObject(value) || Array.isArray(value))) {
        const nested = extractDgiiErrorMessage(value);
        if (nested) {
          return nested;
        }
      }
    }

    // ASP.NET ModelState: { errors: { field: ['msg', ...] }, ... }
    const errors = data.errors ?? data.Errors;
    if (isPlainObject(errors)) {
      const parts = Object.entries(errors)
        .map(([field, value]) => {
          const nested = extractDgiiErrorMessage(value);
          return nested ? `${field}: ${nested}` : undefined;
        })
        .filter((item): item is string => !!item);
      if (parts.length) {
        return truncate(parts.join(' | '));
      }
    } else if (errors) {
      const nested = extractDgiiErrorMessage(errors);
      if (nested) {
        return nested;
      }
    }

    try {
      const serialized = JSON.stringify(data);
      if (serialized && serialized !== '{}') {
        return truncate(serialized);
      }
    } catch {
      // Circular payload, nothing useful to report.
    }
  }

  return undefined;
};

/**
 * Error thrown by every `RestApi` method when a DGII request fails.
 *
 * `message` carries the description DGII actually sent whenever the service
 * provided one, so logging `error.message` no longer reports the opaque
 * `Request failed with status code 400`. The raw payload, the HTTP status and
 * the requested resource stay available for structured logging.
 */
export class DgiiApiError extends Error {
  /** HTTP status returned by DGII, when the request reached the service. */
  readonly status?: number;
  /** HTTP status text returned by DGII. */
  readonly statusText?: string;
  /** Axios error code (`ECONNABORTED`, `ETIMEDOUT`, ...) for transport errors. */
  readonly code?: string;
  /** Resource that was requested. */
  readonly resource?: string;
  /** HTTP method used for the request. */
  readonly method?: string;
  /** Base url used for the request. */
  readonly baseURL?: string;
  /** Raw response body as received from DGII. */
  readonly data?: unknown;
  /** `mensajes` returned by DGII, when the body carried them. */
  readonly mensajes?: Mensaje[];

  constructor(message: string, options: DgiiApiErrorOptions = {}) {
    super(message);
    this.name = 'DgiiApiError';
    // Required so `instanceof` keeps working when the package is compiled
    // down to ES5 by consumers.
    Object.setPrototypeOf(this, DgiiApiError.prototype);

    this.status = options.status;
    this.statusText = options.statusText;
    this.code = options.code;
    this.resource = options.resource;
    this.method = options.method;
    this.baseURL = options.baseURL;
    this.data = options.data;
    this.mensajes = options.mensajes;

    if (options.cause !== undefined) {
      // `cause` is not part of the ES2020 lib this package targets.
      (this as unknown as { cause?: unknown }).cause = options.cause;
    }
  }

  /**
   * Errors serialize to `{}` with `JSON.stringify`, which is how these values
   * end up persisted by the consumers (tracking records, CloudWatch logs), so
   * the useful fields are exposed explicitly.
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      code: this.code,
      resource: this.resource,
      method: this.method,
      mensajes: this.mensajes,
      data: this.data,
    };
  }
}

/**
 * Normalize anything thrown by axios (or by our own code) into a
 * `DgiiApiError` carrying the real DGII description.
 */
export const toDgiiApiError = (
  err: unknown,
  context: DgiiApiErrorContext = {}
): DgiiApiError => {
  if (err instanceof DgiiApiError) {
    return err;
  }

  if (axios.isAxiosError(err)) {
    const response = err.response;
    const data = response?.data;
    const dgiiMessage = extractDgiiErrorMessage(data);
    const status = response?.status;
    const statusText = response?.statusText;

    const fallback =
      context.fallbackMessage ||
      (status
        ? `DGII request failed with status code ${status}${
            statusText ? ` (${statusText})` : ''
          }`
        : err.message || 'DGII request failed');

    return new DgiiApiError(dgiiMessage || fallback, {
      status,
      statusText,
      code: err.code,
      data,
      mensajes: isPlainObject(data)
        ? readMensajes(data.mensajes ?? data.Mensajes)
        : undefined,
      resource: context.resource ?? err.config?.url,
      method: (context.method ?? err.config?.method)?.toUpperCase(),
      baseURL: context.baseURL ?? err.config?.baseURL,
      cause: err,
    });
  }

  if (err instanceof Error) {
    return new DgiiApiError(
      err.message || context.fallbackMessage || 'DGII request failed',
      {
        ...context,
        cause: err,
      }
    );
  }

  // The DGII payload itself (or anything else) was thrown.
  const message =
    extractDgiiErrorMessage(err) ||
    context.fallbackMessage ||
    'DGII request failed';
  const status =
    isPlainObject(err) && typeof err.status === 'number'
      ? err.status
      : undefined;

  return new DgiiApiError(message, {
    ...context,
    status,
    data: err,
    mensajes: isPlainObject(err)
      ? readMensajes(err.mensajes ?? err.Mensajes)
      : undefined,
    cause: err,
  });
};

export default DgiiApiError;
