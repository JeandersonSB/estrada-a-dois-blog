import { youTubeEmbedUrl } from '@/lib/youtube';

export function YouTubeEmbed({ id, title }: { id: string; title?: string }) {
  return (
    <div className="my-6 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
      <iframe
        className="h-full w-full"
        src={youTubeEmbedUrl(id)}
        title={title || 'Vídeo do Estrada a Dois no YouTube'}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
