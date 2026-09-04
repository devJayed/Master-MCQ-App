const hasMeaningfulBlock = (block) => {
  if (!block || typeof block !== 'object') return false;
  if (block.type === 'image') return Boolean(String(block.url || '').trim());
  if (block.type === 'table') {
    return Array.isArray(block.rows) && block.rows.some((row) =>
      Array.isArray(row) && row.some((cell) => String(cell || '').trim())
    );
  }
  return Boolean(String(block.text || '').trim());
};

const hasRichLanguage = (content, language) =>
  Array.isArray(content?.[language]) && content[language].some(hasMeaningfulBlock);

const richLanguageToText = (content, language) =>
  (Array.isArray(content?.[language]) ? content[language] : [])
    .map((block) => {
      if (block?.type === 'image') return [block.url, block.alt, block.caption].filter(Boolean).join(' ');
      if (block?.type === 'table') return (block.rows || []).flat().join(' ');
      return block?.text || '';
    })
    .join(' ')
    .trim();

module.exports = { hasMeaningfulBlock, hasRichLanguage, richLanguageToText };
