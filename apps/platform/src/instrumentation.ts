export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.on("unhandledRejection", (reason, promise) => {
      if (reason instanceof Error) {
        const msg = reason.message || "";
        if (
          reason.name === "AbortError" ||
          msg.includes("signal is aborted") ||
          msg.includes("The operation was aborted") ||
          msg.includes("aborted a request")
        ) {
          promise.catch(() => {});
          return;
        }
      }
    });
  }
}
