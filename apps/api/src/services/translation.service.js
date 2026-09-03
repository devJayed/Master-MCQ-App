const { hasRichLanguage } = require('../utils/richContent');

function missing(value) {
  return !value || !value.trim();
}

async function translateText(banglaText) {
  const provider = process.env.TRANSLATION_PROVIDER || 'mymemory';

  if (provider === 'mymemory') {
    const endpoint = process.env.TRANSLATION_API_URL || 'https://api.mymemory.translated.net/get';
    const url = new URL(endpoint);
    url.searchParams.set('q', banglaText);
    url.searchParams.set('langpair', 'bn|en');
    const response = await fetch(url);
    const payload = await response.json();
    if (!response.ok || payload.responseStatus !== 200 || !payload.responseData?.translatedText?.trim())
      throw new Error(payload.responseDetails || 'English translation failed.');
    return payload.responseData.translatedText.trim();
  }

  const endpoint = process.env.TRANSLATION_API_URL;
  if (!endpoint) throw new Error('English translation service is not configured.');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.TRANSLATION_API_KEY
        ? { Authorization: `Bearer ${process.env.TRANSLATION_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({ q: banglaText, source: 'bn', target: 'en', format: 'text' }),
  });
  if (!response.ok) throw new Error('English translation failed.');
  const payload = await response.json();
  if (!payload.translatedText?.trim()) throw new Error('English translation returned no content.');
  return payload.translatedText.trim();
}

async function fillLocalizedValue(value, generated, label) {
  if (!value?.bn?.trim()) throw new Error(`Bangla ${label} is required.`);
  // Author-provided English is authoritative. Translation is only a fallback
  // for an empty English field and never replaces supplied bilingual content.
  if (!missing(value.en)) return value;
  generated.push(label);
  return { ...value, en: await translateText(value.bn) };
}

async function fillMissingEnglish(
  questionPayload,
  targets = ['question', 'options', 'explanation']
) {
  const generated = [];
  let question = questionPayload.question;
  if (targets.includes('question')) {
    const hasRichBangla = hasRichLanguage(questionPayload.questionContent, 'bn');
    const hasRichEnglish = hasRichLanguage(questionPayload.questionContent, 'en');
    if (hasRichBangla) {
      if (!hasRichEnglish && !questionPayload.question?.en?.trim()) {
        throw new Error('Add English rich question content before publishing.');
      }
    } else if (hasRichEnglish) {
      if (!questionPayload.question?.bn?.trim()) {
        throw new Error('Bangla question text or Bangla rich question content is required.');
      }
    } else {
      question = await fillLocalizedValue(questionPayload.question, generated, 'question');
    }
  }
  const explanation = targets.includes('explanation')
    ? await fillLocalizedValue(questionPayload.explanation, generated, 'explanation')
    : questionPayload.explanation;
  let options = questionPayload.options;
  if (targets.includes('options')) {
    if (!Array.isArray(questionPayload.options) || questionPayload.options.length !== 4)
      throw new Error('Exactly four Bangla options are required.');
    options = [];
    for (const option of questionPayload.options)
      options.push({
        ...option,
        text: await fillLocalizedValue(option.text, generated, `option ${option.key}`),
      });
  }
  return { ...questionPayload, question, explanation, options, generatedEnglishFields: generated };
}

module.exports = { fillMissingEnglish };
