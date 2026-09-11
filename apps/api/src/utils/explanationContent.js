const { hasRichLanguage } = require('./richContent');

const explanationContentError = (text, content, requireEnglish = false) => {
  for (const language of ['bn', 'en']) {
    const plain = Boolean(text?.[language]?.trim());
    const rich = hasRichLanguage(content, language);
    if (plain && rich)
      return `Use either plain or rich explanation content for ${language}, not both.`;
    if (!plain && !rich && (language === 'bn' || requireEnglish))
      return `${language === 'bn' ? 'Bangla' : 'English'} explanation text or rich explanation content is required.`;
  }
  return null;
};

module.exports = { explanationContentError };
