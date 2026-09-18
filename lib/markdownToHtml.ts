import { remark } from 'remark';
import html from 'remark-html';
import { addTargetBlankToExternalLinks } from './posts';

export default async function markdownToHtml(markdown: string) {
  const result = await remark().use(html).process(markdown);
  return addTargetBlankToExternalLinks(result.toString());
}