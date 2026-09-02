'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

const emptyBlock = (type) => ({
  type,
  text: '',
  ...(type === 'code' ? { language: 'c' } : {}),
  ...(type === 'math' ? { display: true } : {}),
  ...(type === 'image' ? { url: '', alt: '', caption: '' } : {}),
  ...(type === 'table' ? { rows: [['Heading 1', 'Heading 2'], ['', '']] } : {}),
});

function BlockFields({ block, onChange }) {
  if (block.type === 'image') {
    return (
      <div className="grid gap-2">
        <input className="input input-bordered input-sm" value={block.url || ''} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="https://… image URL" />
        <input className="input input-bordered input-sm" value={block.alt || ''} onChange={(e) => onChange({ ...block, alt: e.target.value })} placeholder="Alternative text (required for meaningful images)" />
        <input className="input input-bordered input-sm" value={block.caption || ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} placeholder="Caption (optional)" />
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <textarea
        className="textarea textarea-bordered min-h-24 font-mono text-xs"
        value={(block.rows || []).map((row) => row.join('\t')).join('\n')}
        onChange={(e) => onChange({ ...block, rows: e.target.value.split('\n').map((row) => row.split('\t')) })}
        placeholder={'Heading 1\tHeading 2\nCell 1\tCell 2'}
      />
    );
  }

  return (
    <div className="grid gap-2">
      {block.type === 'code' && (
        <input className="input input-bordered input-sm" value={block.language || ''} onChange={(e) => onChange({ ...block, language: e.target.value })} placeholder="Language, e.g. c, javascript" />
      )}
      {block.type === 'math' && (
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" className="checkbox checkbox-xs" checked={Boolean(block.display)} onChange={(e) => onChange({ ...block, display: e.target.checked })} /> Display equation</label>
      )}
      <textarea
        className={`textarea textarea-bordered min-h-24 ${block.type === 'code' ? 'font-mono text-xs' : ''}`}
        value={block.text || ''}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder={block.type === 'math' ? 'LaTeX, e.g. x^2 + y^2 = z^2' : block.type === 'code' ? 'Paste clean source code' : 'Text'}
      />
    </div>
  );
}

export default function RichContentEditor({ value, onChange, language, label }) {
  const blocks = Array.isArray(value?.[language]) ? value[language] : [];
  const setBlocks = (next) => onChange({ ...(value || {}), [language]: next });
  const update = (index, block) => setBlocks(blocks.map((item, itemIndex) => itemIndex === index ? block : item));
  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  };

  return (
    <div className="rounded-box border border-base-300 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <b className="text-sm">{label} · {language === 'bn' ? 'বাংলা' : 'English'}</b>
        <div className="dropdown dropdown-end">
          <button type="button" tabIndex={0} className="btn btn-outline btn-xs"><Plus size={13} /> Add block</button>
          <ul tabIndex={0} className="menu dropdown-content z-20 mt-1 w-40 rounded-box border border-base-300 bg-base-100 p-2 shadow">
            {['text', 'code', 'math', 'image', 'table'].map((type) => (
              <li key={type}><button type="button" className="capitalize" onClick={() => setBlocks([...blocks, emptyBlock(type)])}>{type}</button></li>
            ))}
          </ul>
        </div>
      </div>
      {!blocks.length && <p className="text-xs text-base-content/50">No rich blocks. Plain text will be used.</p>}
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div key={index} className="rounded-box bg-base-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="badge badge-ghost badge-sm capitalize">{block.type}</span>
              <div className="flex">
                <button type="button" className="btn btn-ghost btn-xs" disabled={!index} onClick={() => move(index, -1)} aria-label="Move block up"><ArrowUp size={13} /></button>
                <button type="button" className="btn btn-ghost btn-xs" disabled={index === blocks.length - 1} onClick={() => move(index, 1)} aria-label="Move block down"><ArrowDown size={13} /></button>
                <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => setBlocks(blocks.filter((_, itemIndex) => itemIndex !== index))} aria-label="Delete block"><Trash2 size={13} /></button>
              </div>
            </div>
            <BlockFields block={block} onChange={(next) => update(index, next)} />
          </div>
        ))}
      </div>
    </div>
  );
}
