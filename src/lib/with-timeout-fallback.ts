type TimeoutOptions<T> = {
  fallback: T;
  label?: string;
  timeoutMs?: number;
};

export async function withTimeoutFallback<T>(
  promise: Promise<T>,
  { fallback, label, timeoutMs = 1500 }: TimeoutOptions<T>,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise.catch((error) => {
        if (label) {
          console.warn(`[withTimeoutFallback] ${label} failed`, error);
        }
        return fallback;
      }),
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          if (label) {
            console.warn(
              `[withTimeoutFallback] ${label} timed out after ${timeoutMs}ms`,
            );
          }
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
