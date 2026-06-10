"use client";

function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const idMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  const id = idMatch ? idMatch[1] : trimmed.length === 11 ? trimmed : null;
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

function getYouTubeWatchUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const idMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  const id = idMatch ? idMatch[1] : trimmed.length === 11 ? trimmed : null;
  if (!id) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}

export default function LessonVideo({ videoUrl }: { videoUrl: string | null | undefined }) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const watchUrl = getYouTubeWatchUrl(videoUrl);

  if (!embedUrl || !watchUrl) return null;

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-lg font-bold">Видеоматериал</h3>
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-[var(--border)] bg-black">
        <iframe
          src={embedUrl}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:underline"
      >
        Открыть на YouTube
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
