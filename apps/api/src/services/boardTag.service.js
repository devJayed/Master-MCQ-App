const BOARD_SHORT_NAMES = {
  dhaka: 'DB',
  chattogram: 'Ctg.B',
  chittagong: 'Ctg.B',
  cumilla: 'CB',
  rajshahi: 'RB',
  jashore: 'JB',
  barishal: 'BB',
  sylhet: 'SB',
  dinajpur: 'Din.B',
  'all board': 'All B',
  all: 'All B',
};

const normalizeBoardKey = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeYear = (year) => {
  const raw = String(year ?? '').replace(/\D/g, '');
  if (!raw) return '';
  return raw.slice(-2);
};

function buildBoardTag(board, year) {
  const key = normalizeBoardKey(board);
  const shortName = BOARD_SHORT_NAMES[key];
  if (!shortName) return '';
  const yearShortName = normalizeYear(year);
  if (!yearShortName) return shortName;
  return `${shortName}'${yearShortName}`;
}

function getBoardShortName(board) {
  return BOARD_SHORT_NAMES[normalizeBoardKey(board)] || '';
}

module.exports = {
  buildBoardTag,
  getBoardShortName,
  normalizeBoardKey,
  BOARD_SHORT_NAMES,
};