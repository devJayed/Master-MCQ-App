const { hasRichLanguage } = require('./richContent');

// One representation is selected for the whole bilingual option.
const optionContentError = (key, text, content, requireEnglish = false) => {
  const plainBn = Boolean(text?.bn?.trim());
  const plainEn = Boolean(text?.en?.trim());
  const richBn = hasRichLanguage(content, 'bn');
  const richEn = hasRichLanguage(content, 'en');
  if ((plainBn || plainEn) && (richBn || richEn))
    return `Option ${key}: use either plain BN/EN text or rich BN/EN content, not both.`;
  if (!plainBn && !richBn) return `Option ${key} Bangla text or Bangla rich content is required.`;
  if (requireEnglish && !plainEn && !richEn)
    return `Published questions require English ${richBn ? 'rich content' : 'text'} for option ${key}.`;
  return null;
};

module.exports = { optionContentError };
