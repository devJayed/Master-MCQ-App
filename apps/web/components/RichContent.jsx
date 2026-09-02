'use client';

import { BlockMath, InlineMath } from 'react-katex';

export const localValue = (value, language) =>
  value?.[language] || value?.bn || value?.en || '';

export const localBlocks = (value, language) => {
  const preferred = value?.[language];
  if (Array.isArray(preferred) && preferred.length) return preferred;
  const fallback = language === 'bn' ? value?.en : value?.bn;
  return Array.isArray(fallback) ? fallback : [];
};

const safeImageUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
  } catch {
    return '';
  }
};

function ContentBlock({ block }) {
  if (!block || typeof block !== 'object') return null;

  if (block.type === 'code') {
    return (
      <figure className="my-2 flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-base-300 bg-neutral text-neutral-content">
        {block.language && (
          <figcaption className="order-first block w-full shrink-0 border-b border-white/15 px-3 py-1.5 text-left text-[10px] font-bold tracking-widest uppercase">
            {block.language}
          </figcaption>
        )}
        <pre className="block w-full min-w-0 overflow-x-auto p-3 text-left font-mono text-xs leading-relaxed sm:text-sm">
          <code>{block.text || ''}</code>
        </pre>
      </figure>
    );
  }

  if (block.type === 'math') {
    const MathComponent = block.display ? BlockMath : InlineMath;
    return (
      <span className={block.display ? 'my-2 block overflow-x-auto' : ''}>
        <MathComponent math={block.text || ''} renderError={() => <code>{block.text}</code>} />
      </span>
    );
  }

  if (block.type === 'image') {
    const src = safeImageUrl(block.url);
    if (!src) return null;
    return (
      <figure className="my-2">
        {/* Remote author assets intentionally use a plain img; the URL is protocol-validated. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={block.alt || ''}
          loading="lazy"
          className="mx-auto max-h-[32rem] max-w-full rounded-lg object-contain"
        />
        {block.caption && (
          <figcaption className="mt-1 text-center text-xs text-base-content/60">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === 'table') {
    const rows = Array.isArray(block.rows) ? block.rows : [];
    if (!rows.length) return null;
    return (
      <div className="my-2 overflow-x-auto rounded-lg border border-base-300">
        <table className="table table-sm min-w-max">
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {(Array.isArray(row) ? row : []).map((cell, cellIndex) => {
                  const Cell = rowIndex === 0 ? 'th' : 'td';
                  return <Cell key={cellIndex}>{cell}</Cell>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <p className="my-1 whitespace-pre-wrap">{block.text || ''}</p>;
}

export function RichContent({ content, fallback, language, className = '' }) {
  const blocks = localBlocks(content, language);
  if (!blocks.length) return <span className={className}>{localValue(fallback, language)}</span>;
  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <ContentBlock block={block} key={`${block.type}-${index}`} />
      ))}
    </div>
  );
}

export function Stimulus({ stimulus, language }) {
  const blocks = localBlocks(stimulus?.content, language);
  const title = localValue(stimulus?.title, language);
  if (!title && !blocks.length) return null;
  return (
    <aside className="mb-3 mt-2 rounded-box border border-primary/20 bg-primary/5 p-3 text-base leading-relaxed md:p-4">
      {title && <p className="mb-2 font-semibold">{title}</p>}
      <RichContent content={stimulus.content} language={language} />
    </aside>
  );
}
