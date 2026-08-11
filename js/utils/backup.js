/** Import / export complet de l'état utilisateur. */
export const BACKUP_VERSION = 1;

export function createBackup(state) {
  return {
    app: "mimi-muscu",
    type: "full-backup",
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    state,
  };
}

export function validateBackup(raw) {
  if (
    !raw ||
    raw.app !== "mimi-muscu" ||
    raw.type !== "full-backup" ||
    !raw.state
  ) {
    throw new Error("Sauvegarde Mimi Muscu invalide.");
  }
  return raw.state;
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
