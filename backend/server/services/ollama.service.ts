export type OllamaRole = "system" | "user" | "assistant";

export type OllamaMessage = {
  role: OllamaRole;
  content: string;
};

export type OllamaErrorCode =
  | "OLLAMA_UNAVAILABLE"
  | "OLLAMA_TIMEOUT"
  | "OLLAMA_MODEL_NOT_FOUND"
  | "OLLAMA_BAD_RESPONSE";

export class OllamaServiceError extends Error {
  code: OllamaErrorCode;
  status?: number;
  detail?: string;

  constructor(code: OllamaErrorCode, message: string, options: { status?: number; detail?: string } = {}) {
    super(message);
    this.name = "OllamaServiceError";
    this.code = code;
    this.status = options.status;
    this.detail = options.detail;
  }
}

type OllamaModel = {
  name?: string;
  model?: string;
};

type OllamaTagsResponse = {
  models?: OllamaModel[];
};

type OllamaChatResponse = {
  message?: {
    role?: string;
    content?: string;
  };
  error?: string;
};

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434/api";
const DEFAULT_OLLAMA_MODEL = "gemma4:e2b";
const DEFAULT_TIMEOUT_MS = 120_000;

export function getOllamaModel() {
  const raw = process.env.OLLAMA_MODEL?.trim();
  if (!raw) return DEFAULT_OLLAMA_MODEL;

  // Common typo: "gamma4" vs "gemma4"
  if (raw.toLowerCase().startsWith("gamma4:")) {
    return `gemma4:${raw.split(":").slice(1).join(":")}`;
  }

  return raw;
}

export function normalizeOllamaBaseUrl(value = process.env.OLLAMA_BASE_URL) {
  const raw = (value?.trim() || DEFAULT_OLLAMA_BASE_URL).replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

export function getOllamaUserMessage(error: unknown) {
  if (error instanceof OllamaServiceError) {
    if (error.code === "OLLAMA_MODEL_NOT_FOUND") {
      return `Local Ollama is running, but the model "${getOllamaModel()}" is not installed. Run "ollama pull ${getOllamaModel()}" and try again.`;
    }

    if (error.code === "OLLAMA_TIMEOUT") {
      return "Local Ollama took too long to respond. Make sure the model is loaded and try again.";
    }

    if (error.code === "OLLAMA_BAD_RESPONSE") {
      return "Local Ollama returned an unexpected response. Try regenerating the AI output.";
    }

    return "Local Ollama is not reachable. Start Ollama locally and make sure the selected model is available.";
  }

  return "The local AI service could not complete the request. Please try again.";
}

export function getOllamaErrorStatus(error: unknown) {
  if (!(error instanceof OllamaServiceError)) {
    return 500;
  }

  if (error.code === "OLLAMA_BAD_RESPONSE") {
    return 502;
  }

  return 503;
}

async function requestOllamaJson<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${normalizeOllamaBaseUrl()}/${path.replace(/^\/+/, "")}`;

  let response: globalThis.Response;

  try {
    response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new OllamaServiceError("OLLAMA_TIMEOUT", "Ollama request timed out");
    }

    throw new OllamaServiceError("OLLAMA_UNAVAILABLE", "Ollama is not reachable", {
      detail: error?.message,
    });
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let payload: any = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new OllamaServiceError("OLLAMA_BAD_RESPONSE", "Ollama returned non-JSON response", {
        status: response.status,
        detail: text.slice(0, 500),
      });
    }
  }

  if (!response.ok) {
    const detail = typeof payload?.error === "string" ? payload.error : text;
    const isMissingModel =
      response.status === 404 ||
      /model .* not found|not found, try pulling|pull/i.test(detail ?? "");

    throw new OllamaServiceError(
      isMissingModel ? "OLLAMA_MODEL_NOT_FOUND" : "OLLAMA_UNAVAILABLE",
      detail || `Ollama request failed with status ${response.status}`,
      { status: response.status, detail },
    );
  }

  return payload as T;
}

export async function listOllamaModels() {
  const response = await requestOllamaJson<OllamaTagsResponse>("tags", { method: "GET" }, 20_000);
  return response.models ?? [];
}

export async function ensureOllamaModelAvailable(model = getOllamaModel()) {
  const models = await listOllamaModels();
  const exists = models.some((item) => item.model === model || item.name === model);

  if (!exists) {
    throw new OllamaServiceError(
      "OLLAMA_MODEL_NOT_FOUND",
      `Model "${model}" was not found in local Ollama`,
      { status: 404 },
    );
  }
}

export async function chatWithOllama(
  messages: OllamaMessage[],
  options: { format?: "json"; temperature?: number; timeoutMs?: number } = {},
) {
  const model = getOllamaModel();
  await ensureOllamaModelAvailable(model);

  const response = await requestOllamaJson<OllamaChatResponse>(
    "chat",
    {
      method: "POST",
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        ...(options.format ? { format: options.format } : {}),
        options: {
          temperature: options.temperature ?? 0.3,
        },
      }),
    },
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  const content = response.message?.content?.trim();
  if (!content) {
    throw new OllamaServiceError("OLLAMA_BAD_RESPONSE", "Ollama chat response did not include content");
  }

  return content;
}
