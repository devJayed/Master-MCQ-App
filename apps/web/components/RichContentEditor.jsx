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

function BilingualBlock({ block, index, count, onUpdate, onMove, onDelete }) {
  const type = block.bn?.type || block.en?.type || 'text';

  return (
    <section className="rounded-box border border-base-300 bg-base-100 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="badge badge-primary badge-sm">{index + 1}</span>
          <span className="badge badge-ghost badge-sm capitalize">{type}</span>
        </div>
        <div className="flex">
          <button type="button" className="btn btn-ghost btn-xs" disabled={!index} onClick={() => onMove(-1)} aria-label={`Move ${type} block up`}><ArrowUp size={13} /></button>
          <button type="button" className="btn btn-ghost btn-xs" disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Move ${type} block down`}><ArrowDown size={13} /></button>
          <button type="button" className="btn btn-ghost btn-xs text-error" onClick={onDelete} aria-label={`Delete ${type} block`}><Trash2 size={13} /></button>
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <div className="grid content-start gap-2">
          <span className="text-xs font-semibold">বাংলা</span>
          <BlockFields block={block.bn || emptyBlock(type)} onChange={(next) => onUpdate('bn', next)} />
        </div>
        <div className="grid content-start gap-2">
          <span className="text-xs font-semibold">English <small className="font-normal text-base-content/50">(optional)</small></span>
          <BlockFields block={block.en || emptyBlock(type)} onChange={(next) => onUpdate('en', next)} />
        </div>
      </div>
    </section>
  );
}

export default function RichContentEditor({ value, onChange, label }) {
  const bnBlocks = Array.isArray(value?.bn) ? value.bn : [];
  const enBlocks = Array.isArray(value?.en) ? value.en : [];
  const blockCount = Math.max(bnBlocks.length, enBlocks.length);
  const blocks = Array.from({ length: blockCount }, (_, index) => {
    const type = bnBlocks[index]?.type || enBlocks[index]?.type || 'text';
    return {
      bn: bnBlocks[index] || emptyBlock(type),
      en: enBlocks[index] || emptyBlock(type),
    };
  });

  const commit = (nextBlocks) =>
    onChange({
      ...(value || {}),
      bn: nextBlocks.map((block) => block.bn),
      en: nextBlocks.map((block) => block.en),
    });

  const add = (type) => commit([...blocks, { bn: emptyBlock(type), en: emptyBlock(type) }]);
  const update = (index, language, next) =>
    commit(
      blocks.map((block, itemIndex) =>
        itemIndex === index ? { ...block, [language]: next } : block
      )
    );
  const move = (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  return (
    <div className="rounded-box border border-base-300 bg-base-200/40 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <b className="text-sm">{label}</b>
          <p className="mt-0.5 text-xs text-base-content/60">Each block keeps its Bangla and optional English content together.</p>
        </div>
        <div className="dropdown dropdown-end">
          <button type="button" tabIndex={0} className="btn btn-outline btn-xs"><Plus size={13} /> Add block</button>
          <ul tabIndex={0} className="menu dropdown-content z-20 mt-1 w-40 rounded-box border border-base-300 bg-base-100 p-2 shadow">
            {['text', 'code', 'math', 'image', 'table'].map((type) => (
              <li key={type}><button type="button" className="capitalize" onClick={() => add(type)}>{type}</button></li>
            ))}
          </ul>
        </div>
      </div>
      {!blocks.length && <p className="text-xs text-base-content/50">No content blocks added.</p>}
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <BilingualBlock
            key={index}
            block={block}
            index={index}
            count={blocks.length}
            onUpdate={(language, next) => update(index, language, next)}
            onMove={(offset) => move(index, offset)}
            onDelete={() => commit(blocks.filter((_, itemIndex) => itemIndex !== index))}
          />
        ))}
      </div>
    </div>
  );
}
