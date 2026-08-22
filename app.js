const chapters = [
  ['01', 'ICT: World & Bangladesh', '18'],
  ['02', 'Communication Systems', '24'],
  ['03', 'Number System', '32'],
  ['04', 'Web Design', '28'],
  ['05', 'Programming', '35'],
  ['06', 'Database & HTML', '21'],
];
const questions = [
  {
    q: 'Which number system uses base 2?',
    a: ['Decimal', 'Binary', 'Octal', 'Hexadecimal'],
    correct: 1,
    ex: 'Binary uses only the digits 0 and 1, so its base is 2.',
  },
  {
    q: 'What is the decimal value of (1010)₂?',
    a: ['8', '10', '12', '14'],
    correct: 1,
    ex: '1010₂ = 1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8 + 2 = 10.',
  },
  {
    q: 'Which logic gate produces 1 only when both inputs are 1?',
    a: ['OR gate', 'NOT gate', 'AND gate', 'XOR gate'],
    correct: 2,
    ex: 'An AND gate outputs 1 only if every input is 1.',
  },
  {
    q: 'The octal number system uses which base?',
    a: ['2', '8', '10', '16'],
    correct: 1,
    ex: 'Octal uses eight symbols, from 0 through 7.',
  },
  {
    q: 'Which HTML tag creates a hyperlink?',
    a: ['<img>', '<link>', '<a>', '<p>'],
    correct: 2,
    ex: 'The anchor, or <a>, element creates a hyperlink.',
  },
];
let current = 0,
  answers = [],
  timerId,
  seconds = 600;
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function chaptersHTML(target, cls = 'chapter') {
  $(target).innerHTML = chapters
    .map(
      (c, i) =>
        `<button class="${cls} ${i === 0 ? 'active' : ''}" data-index="${i}">${cls === 'chapter' ? `<span class="chapter-num">${c[0]}</span><strong>${c[1]}</strong><small>${c[2]} questions</small>` : `Chapter ${c[0]}<small>${c[1]}</small>`}</button>`
    )
    .join('');
}
chaptersHTML('#chapterGrid');
chaptersHTML('#practiceChapters', 'choice');
chaptersHTML('#testChapters', 'choice');
function showPage(id) {
  $$('.page').forEach((p) => p.classList.remove('visible'));
  $('#' + id).classList.add('visible');
  $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.page === id));
  $('#crumb').textContent =
    id === 'test'
      ? 'Active test'
      : id === 'result'
        ? 'Test result'
        : id === 'create'
          ? 'Create a test'
          : id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (id !== 'test') clearInterval(timerId);
}
$$('[data-page]').forEach((el) => el.addEventListener('click', () => showPage(el.dataset.page)));
$$('.choice').forEach((el) => el.addEventListener('click', () => el.classList.toggle('active')));
let count = 20;
function updateCount() {
  $('#questionCount').textContent = count;
  $('#previewQuestions').textContent = count;
}
$('#plus').onclick = () => {
  if (count < 50) {
    count += 5;
    updateCount();
  }
};
$('#minus').onclick = () => {
  if (count > 5) {
    count -= 5;
    updateCount();
  }
};
$('#timer').onchange = (e) =>
  ($('#previewTimer').textContent = e.target.value === '0' ? 'No timer' : e.target.value + ' min');
$$('.difficulty button').forEach((b) => (b.onclick = () => b.classList.toggle('active')));
function startTest(label = 'Custom ICT practice') {
  current = 0;
  answers = Array(questions.length).fill(null);
  seconds = Number($('#timer')?.value || 10) * 60 || 600;
  $('#testLabel').textContent = label.toUpperCase();
  showPage('test');
  renderQuestion();
  timerId = setInterval(() => {
    seconds--;
    let m = String(Math.floor(seconds / 60)).padStart(2, '0'),
      s = String(seconds % 60).padStart(2, '0');
    $('#clock').textContent = `${m}:${s}`;
    if (seconds <= 0) finish();
  }, 1000);
}
$('#startCustom').onclick = () => startTest('Custom ICT practice');
$('.start-from-practice').onclick = () => startTest('Topic practice');
$$('.round-start').forEach((b) => (b.onclick = () => startTest(b.dataset.test)));
function renderQuestion() {
  let q = questions[current];
  $('#questionText').textContent = q.q;
  $('#testPosition').textContent = `Question ${current + 1} of ${questions.length}`;
  $('#progressBar').style.width = `${((current + 1) / questions.length) * 100}%`;
  $('#answers').innerHTML = q.a
    .map(
      (a, i) =>
        `<button class="answer ${answers[current] === i ? 'selected' : ''}" data-a="${i}"><b>${'ABCD'[i]}</b>${a}</button>`
    )
    .join('');
  $('#questionDots').innerHTML = questions
    .map((_, i) => `<i class="${i === current ? 'active' : ''}"></i>`)
    .join('');
  $('#previousQuestion').style.visibility = current ? 'visible' : 'hidden';
  $('#nextQuestion').innerHTML =
    current === questions.length - 1 ? 'Finish test <b>→</b>' : 'Next question <b>→</b>';
  $$('.answer').forEach(
    (b) =>
      (b.onclick = () => {
        answers[current] = Number(b.dataset.a);
        renderQuestion();
      })
  );
}
$('#previousQuestion').onclick = () => {
  if (current) {
    current--;
    renderQuestion();
  }
};
$('#nextQuestion').onclick = () => {
  if (current === questions.length - 1) finish();
  else {
    current++;
    renderQuestion();
  }
};
function finish() {
  clearInterval(timerId);
  let score = answers.reduce((total, a, i) => total + (a === questions[i].correct), 0);
  $('#resultScore').textContent = `${score} / ${questions.length}`;
  $('#correctMetric').textContent = score;
  $('#wrongMetric').textContent = questions.length - score;
  showPage('result');
}
$('#switchRole').onclick = () => {
  alert(
    'Teacher space is mapped for the next build: question bank, students, results, and analytics. This MVP keeps the student learning flow front and centre.'
  );
};
