// Utilitários para exibir vídeos do YouTube nos artigos.
//
// O Markdown passa por um sanitizador que remove <iframe>. Por isso o player
// não é escrito à mão no texto: basta colar o link do vídeo sozinho em uma
// linha (ou no campo "Vídeo do YouTube" do painel) e o site monta o player.

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Extrai o ID de 11 caracteres de um link do YouTube (ou retorna null). */
export function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const value = String(input).trim();
  if (YOUTUBE_ID.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id: string | null = null;

  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] || null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      const match = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = match ? match[1] : null;
    }
  }

  return id && YOUTUBE_ID.test(id) ? id : null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** URL do player no modo de privacidade aprimorada do YouTube. */
export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}

/** HTML do player responsivo (16:9), carregado só quando chega perto da tela. */
export function youTubeEmbedHtml(id: string, title = 'Vídeo do Estrada a Dois no YouTube'): string {
  return (
    '<div class="not-prose my-8 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">' +
    `<iframe class="h-full w-full" src="${youTubeEmbedUrl(id)}" title="${escapeAttr(title)}" ` +
    'loading="lazy" referrerpolicy="strict-origin-when-cross-origin" ' +
    'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ' +
    'allowfullscreen></iframe></div>'
  );
}

/**
 * Troca parágrafos que contêm apenas um link do YouTube por um player.
 * Links no meio de frases continuam sendo links normais.
 */
export function embedYouTubeLinks(html: string): string {
  return html.replace(
    /<p>\s*(?:<a\b[^>]*\bhref="([^"]+)"[^>]*>[^<]*<\/a>|(https?:\/\/[^\s<]+))\s*<\/p>/gi,
    (match, href?: string, bare?: string) => {
      const raw = (href || bare || '').replace(/&amp;/g, '&');
      const id = extractYouTubeId(raw);
      return id ? youTubeEmbedHtml(id) : match;
    },
  );
}
