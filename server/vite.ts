// server/vite.ts

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * In development, the frontend runs on Vite dev server (localhost:5173)
 * This function is intentionally a NO-OP in production.
 */
export async function setupVite() {
  // no-op
}
