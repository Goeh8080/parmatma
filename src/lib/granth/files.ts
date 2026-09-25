export type ToastFile = {
  blob: Blob;
  name: string;
};

export type ToastPayload = {
  message: string;
  file?: ToastFile;
};

export function ping(message: string | ToastPayload) {
  const detail: ToastPayload = typeof message === "string" ? { message } : message;
  window.dispatchEvent(new CustomEvent("granth-toast", { detail }));
}

export async function deliverFile(blob: Blob, fileName: string) {
  const file = new File([blob], fileName, { type: blob.type || "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 20000);
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
    } catch {
      /* download already started; share is optional */
    }
  }
}

export function saveBlob(blob: Blob, fileName: string) {
  void deliverFile(blob, fileName);
}
