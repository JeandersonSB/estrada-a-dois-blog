'use client';

import { useState } from 'react';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    subject: 'Dúvida sobre roteiro / viagem',
    message: '',
    _bot_honey: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem.');
      }

      setStatus('success');
      setFormData({
        name: '',
        whatsapp: '',
        email: '',
        subject: 'Dúvida sobre roteiro / viagem',
        message: '',
        _bot_honey: '',
      });
    } catch (err: unknown) {
      console.error(err);
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Ocorreu um erro ao enviar sua mensagem. Tente novamente ou use nosso e-mail direto.'
      );
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-black text-[#0F0F0F] uppercase mb-2">Envie uma mensagem</h2>
      <p className="text-sm text-gray-500 mb-6">
        Fale conosco sobre dúvidas, dicas ou parcerias. Notificamos nossa equipe na hora!
      </p>

      {status === 'success' && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start space-x-3">
          <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">Mensagem enviada com sucesso!</p>
            <p className="text-sm mt-1">Obrigado pelo contato! Recebemos sua mensagem no nosso Telegram e responderemos o mais breve possível.</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3">
          <svg className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-bold">Ops! Não foi possível enviar agora.</p>
            <p className="text-sm mt-1">{errorMessage}</p>
            <p className="text-xs mt-2">
              Se preferir, envie diretamente para: <a href="mailto:contato@estradaadois.com" className="font-bold underline">contato@estradaadois.com</a>
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Honeypot invisível para enganar e bloquear robôs spammers */}
        <input
          type="text"
          name="_bot_honey"
          value={formData._bot_honey}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
          className="hidden opacity-0 pointer-events-none absolute w-0 h-0"
          aria-hidden="true"
        />

        <div>
          <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Nome <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-[#0F0F0F] bg-white placeholder:text-gray-400 font-medium focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors"
            placeholder="Como você se chama?"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              WhatsApp
            </label>
            <input
              type="tel"
              id="whatsapp"
              name="whatsapp"
              value={formData.whatsapp}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-[#0F0F0F] bg-white placeholder:text-gray-400 font-medium focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors"
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-[#0F0F0F] bg-white placeholder:text-gray-400 font-medium focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors"
              placeholder="seuemail@exemplo.com"
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Assunto
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-[#0F0F0F] bg-white font-medium focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors"
          >
            <option>Dúvida sobre roteiro / viagem</option>
            <option>Parceria Comercial (Marcas)</option>
            <option>Mídia Kit / Imprensa</option>
            <option>Outro</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
            Mensagem <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-[#0F0F0F] bg-white placeholder:text-gray-400 font-medium focus:border-[#B6D200] focus:ring-2 focus:ring-[#B6D200] focus:outline-none transition-colors resize-none"
            placeholder="Escreva sua mensagem aqui..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-[#0F0F0F] hover:bg-[#B6D200] hover:text-black text-white font-black uppercase tracking-widest py-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <span className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </span>
          ) : (
            'Enviar Mensagem'
          )}
        </button>
      </form>
    </div>
  );
}
