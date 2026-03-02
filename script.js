const WEBHOOK_URL = 'https://SummerXZY-n8n-free.hf.space/webhook-test/cfd92f69-246b-414d-a0de-acf19775cbe6';

const setupForm = document.getElementById('setup-form');
const topicInput = document.getElementById('topic');
const numberInput = document.getElementById('number');
const difficultyInput = document.getElementById('difficulty');
const statusText = document.getElementById('status');

const setupSection = document.getElementById('setup-section');
const quizSection = document.getElementById('quiz-section');
const resultsSection = document.getElementById('results-section');

const questionTitle = document.getElementById('question-title');
const progressText = document.getElementById('progress');
const questionText = document.getElementById('question-text');
const optionsForm = document.getElementById('options-form');
const nextBtn = document.getElementById('next-btn');

const scoreText = document.getElementById('score-text');
const restartBtn = document.getElementById('restart-btn');

let questions = [];
let currentIndex = 0;
let score = 0;

function setStatus(message, type = '') {
  statusText.textContent = message;
  statusText.className = `status ${type}`.trim();
}

function normalizeResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.questions)) return data.questions;
  if (data && typeof data === 'object' && data.question) return [data];
  return [];
}

async function fetchQuestions(topic, number, difficulty) {
  const params = new URLSearchParams({ topic, number: String(number), difficulty });
  const url = `${WEBHOOK_URL}?${params.toString()}`;
  const response = await fetch(url, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  const parsedQuestions = normalizeResponse(data);

  if (parsedQuestions.length === 0) {
    throw new Error('No questions received from API.');
  }

  return parsedQuestions;
}

function renderCurrentQuestion() {
  const question = questions[currentIndex];
  questionTitle.textContent = `Question ${currentIndex + 1}`;
  progressText.textContent = `${currentIndex + 1} / ${questions.length}`;
  questionText.textContent = question.question;
  optionsForm.innerHTML = '';
  nextBtn.disabled = true;

  question.options.forEach((option) => {
    const label = document.createElement('label');
    label.className = 'option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'answer';
    radio.value = option.id;

    radio.addEventListener('change', () => {
      nextBtn.disabled = false;
    });

    const text = document.createElement('span');
    text.textContent = `${option.id}. ${option.text}`;

    label.appendChild(radio);
    label.appendChild(text);
    optionsForm.appendChild(label);
  });

  nextBtn.textContent = currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next';
}

function showResults() {
  quizSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  scoreText.textContent = `You scored ${score} out of ${questions.length}.`;
}

setupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus('Loading questions...', '');

  const topic = topicInput.value.trim();
  const number = Number(numberInput.value);
  const difficulty = difficultyInput.value;

  if (!topic || !number || number < 1) {
    setStatus('Please provide valid quiz settings.', 'error');
    return;
  }

  try {
    questions = await fetchQuestions(topic, number, difficulty);
    currentIndex = 0;
    score = 0;

    setStatus(`Loaded ${questions.length} questions successfully.`, 'success');

    setupSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    renderCurrentQuestion();
  } catch (error) {
    setStatus(`Error: ${error.message}`, 'error');
  }
});

nextBtn.addEventListener('click', () => {
  const selected = optionsForm.querySelector('input[name="answer"]:checked');
  if (!selected) return;

  const question = questions[currentIndex];
  if (selected.value === question.correct_answer) {
    score += 1;
  }

  currentIndex += 1;

  if (currentIndex >= questions.length) {
    showResults();
  } else {
    renderCurrentQuestion();
  }
});

restartBtn.addEventListener('click', () => {
  resultsSection.classList.add('hidden');
  quizSection.classList.add('hidden');
  setupSection.classList.remove('hidden');
  setStatus('');
  setupForm.reset();
  numberInput.value = 5;
  difficultyInput.value = 'easy';
});
