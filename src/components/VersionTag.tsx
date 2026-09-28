/** Build stamp, so everyone can check which version their phone is running. */
export const APP_VERSION = `v${__APP_VERSION__}`;
export const APP_BUILD = `${__APP_BUILD__} · ${__APP_COMMIT__}`;

export default function VersionTag({ compact }: { compact?: boolean }) {
  return (
    <div className="version-tag">
      {APP_VERSION}
      {!compact && ` · ${APP_BUILD}`}
    </div>
  );
}
