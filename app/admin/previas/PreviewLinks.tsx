'use client';

import { useState, type FormEvent } from 'react';

const cmsAuthOrigin = 'https://estrada-a-dois-blog.vercel.app';

function extractSlug(value: string): string {
  const raw = value.trim();
  // Accept the entry slug, a /blog/ URL, a draft URL, or the Markdown filename.
  const match = raw.match(/(?:\/blog\/|\/previa\/|\/entries\/|\/content\/posts\/)([a-z0-9-]+)(?:\.md)?(?:[?#/]|$)/i);
  return (match?.[1] || raw.replace(/\.md$/i, '')).toLowerCase();
}

type LinkResult = { url: string; title: string; expiresInDays: number };

export function PreviewLinks({
  hasSession, initialSlug,
}: {
  hasSession: boolean;
  initialSlug: string;
}) {
  const [slug, setSlug] = useState(initialSlug);
  const [result, setResult] = useState<LinkResult | null>(null);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  function connectGitHub() {
    setMessage('');
    const authWindow = window.open(cmsAuthOrigin + '/api/auth', 'ead_preview_github_auth',
      'width=620,height=740,resizable=yes,scrollbars=yes');
    if (!authWindow) {
      setMessage('Autorize pop-ups para entrar com o GitHub.');
      return;
    }
    const onMessage = (event: MessageEvent) => {
      if (event.source !== authWindow || event.origin !== cmsAuthOrigin) return;
      if (event.data === 'authorizing:github') {
        authWindow.postMessage('authorizing:github', cmsAuthOrigin);
        return;
      }
      if (typeof event.data === 'string' && event.data.startsWith('authorization:github:success:')) {
        window.removeEventListener('message', onMessage);
        const next = new URL(cmsAuthOrigin + '/admin/previas');
        const selected = extractSlug(slug);
        if (selected) next.searchParams.set('slug', selected);
        window.location.assign(next.toString());
      }
    };
    window.addEventListener('message', onMessage);
  }

  async function generateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setResult(null);
    setCopied(false);
    const selectedSlug = extractSlug(slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(selectedSlug)) {
      setMessage('Informe o identificador do artigo, sem espaços ou acentos.');
      return;
    }
    setWorking(true);
    try {
      const response = await fetch('/api/previa/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ slug: selectedSlug }),
        cache: 'no-store',
      });
      const data = await response.json() as LinkResult & { error?: string };
      if (!response.ok) {
        setMessage(data.error || 'Não foi possível gerar a prévia.');
        return;
      }
      setResult(data);
    } catch {
      setMessage('Falha de conexão. Tente novamente.');
    } finally {
      setWorking(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
    } catch {
      setMessage('Não foi possível copiar automaticamente. Selecione o link e copie manualmente.');
    }
  }

  return (
    <div>
      {!hasSession && (
        <div className="rounded-xl border border-[#B6D200] bg-[#f7f9e7] px-5 py-5 mb-7">
          <p className="text-[#282828] font-bold mb-2">É necessário entrar com seu GitHub para gerar links.</p>
          <p className="text-sm text-gray-600 mb-4">A Paula não precisa de conta. Apenas quem gera a prévia precisa ter permissão de edição no blog.</p>
          <button type="button" onClick={connectGitHub}
            className="rounded-lg bg-[#403939] text-white px-5 py-3 font-bold hover:bg-black">
            Entrar com GitHub
          </button>
        </div>
      )}
      <form onSubmit={generateLink} className="space-y-4">
        <label className="block font-bold text-[#282828]" htmlFor="article-slug">Artigo salvo como rascunho</label>
        <input id="article-slug" type="text" value={slug} onChange={event => setSlug(event.target.value)}
          autoComplete="off" spellCheck={false}
          placeholder="Ex.: vale-a-pena-viajar-de-moto-para-o-litoral..."
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[#282828] outline-none focus:border-[#B6D200]" />
        <p className="text-xs text-gray-500">Cole o nome do arquivo .md, o identificador (slug) ou o endereço do artigo. Salve o rascunho no Admin antes.</p>
        <button type="submit" disabled={!hasSession || working}
          className="w-full rounded-lg bg-[#B6D200] text-[#282828] px-5 py-3 font-black disabled:opacity-50">
          {working ? 'Gerando link…' : 'Gerar link de prévia'}
        </button>
      </form>
      {message && <p role="alert" className="text-sm text-red-700 mt-4">{message}</p>}
      {result && (
        <div className="mt-6 rounded-xl bg-[#f7f9e7] border border-[#B6D200] p-5">
          <p className="text-[#282828] font-bold mb-1">Link criado para: {result.title}</p>
          <p className="text-xs text-gray-600 mb-3">Válido por sete dias. Se o artigo for publicado antes, a prévia deixa de funcionar.</p>
          <input aria-label="Link de prévia" readOnly value={result.url}
            onFocus={event => event.target.select()}
            className="w-full rounded-md border border-gray-300 p-3 text-sm text-[#282828]" />
          <div className="flex flex-wrap gap-3 mt-4">
            <button type="button" onClick={copyLink}
              className="rounded-lg bg-[#403939] text-white px-5 py-3 font-semibold">
              {copied ? 'Link copiado!' : 'Copiar link para a Paula'}
            </button>
            <a href={result.url} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border border-[#403939] text-[#403939] px-5 py-3 font-semibold">Abrir prévia</a>
          </div>
        </div>
      )}
    </div>
  );
}
