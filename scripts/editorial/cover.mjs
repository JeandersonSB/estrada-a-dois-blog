import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export const SUBJECTS = {
  map: '<path d="M80 60 220 15 360 60 500 15v300l-140 45-140-45-140 45Z"/><path d="M220 15v300m140-255v300"/><path d="M140 185c80-110 150 150 285-20" stroke="#B6D200" stroke-dasharray="12 18"/>',
  bag: '<rect x="100" y="85" width="380" height="250" rx="45"/><path d="M210 85V40h160v45M180 85v250m220-250v250M100 200h380"/><rect x="255" y="175" width="70" height="50" rx="10" fill="#B6D200"/>',
  rain: '<path d="m210 100 80-50 80 50 100 80-60 70-50-35v150H220V215l-50 35-60-70Z"/><path d="M290 50v315m-40-255 40 35 40-35M70 30 45 75m430-50-25 45m70 205-25 45" stroke="#B6D200"/>',
  battery: '<rect x="100" y="100" width="380" height="235" rx="28"/><path d="M155 100V55h70v45m140 0V55h70v45m-285 90h80m-40-40v80m205-40h70"/><path d="m315 160-60 85h65l-35 65" stroke="#B6D200"/>',
  phone: '<rect x="185" y="25" width="210" height="340" rx="35"/><path d="M245 65h90m-70 260h50"/><path d="m265 130-35 65h45l-15 55 85-100h-65l25-55" stroke="#B6D200"/>',
  tyre: '<circle cx="290" cy="190" r="155"/><circle cx="290" cy="190" r="90"/><path d="m185 70 30 35m-60 30 45 20m-55 70 50-5m-10 85 30-35m180-200-30 35m60 30-45 20m55 70-50-5m10 85-30-35" stroke="#B6D200"/>',
  checklist: '<rect x="140" y="45" width="300" height="320" rx="25"/><rect x="225" y="20" width="130" height="50" rx="15"/><path d="m185 135 20 20 35-40m-55 110 20 20 35-40m-55 110 20 20 35-40" stroke="#B6D200"/><path d="M280 140h100m-100 90h100m-100 90h100"/>',
  wash: '<path d="M170 180h240l-25 180H195ZM220 180V95a70 70 0 0 1 140 0v85"/><path d="M105 45C60 110 60 135 105 135s45-25 0-90m370 50c-35 50-35 70 0 70s35-20 0-70" stroke="#B6D200"/><path d="m440 240 25 25m-10 45 25-25M125 255l25 25"/>',
};

export async function createCover(root, slug, subject) {
  if (!SUBJECTS[subject] || !/^[a-z0-9-]+$/.test(slug)) throw new Error('Tema da ilustração inválido.');
  // Ilustração vetorial própria e conceitual. Não busca fotos aleatórias nem
  // representa um produto, teste prático ou procedimento mecânico real.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <rect width="1200" height="675" fill="#202824"/>
  <circle cx="950" cy="80" r="320" fill="#B6D200" opacity=".08"/>
  <path d="M0 600Q270 490 600 600T1200 570" fill="none" stroke="#B6D200" stroke-width="4" opacity=".35"/>
  <g transform="translate(315 105)" fill="#28352C" stroke="#F4F7EE" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">${SUBJECTS[subject]}</g>
  <circle cx="1040" cy="540" r="58" fill="#B6D200"/>
  <path d="m1014 540 18 18 34-38" fill="none" stroke="#202824" stroke-width="10" stroke-linecap="round"/>
  </svg>`;
  const relative = `public/images/blog/${slug}.webp`;
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
  await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(path.join(root, relative));
  return `/images/blog/${slug}.webp`;
}
