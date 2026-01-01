// EduMind Pure Static Logic

// 1. Dark Mode Toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

// 2. View Switching Logic
function showView(viewId) {
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.classList.remove('active'));
    
    // Show target view
    const target = document.getElementById(viewId + '-view');
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }

    // Reset components if needed
    if(viewId === 'affairs') loadNews();
}

// 3. Current Affairs Logic
function loadNews() {
    const container = document.getElementById('news-container');
    const lang = document.getElementById('news-lang').value;
    
    const sampleNews = {
        'English': [
            { category: '[SCIENCE]', title: 'New Exoplanet Discovered', content: 'Scientists found an Earth-like planet in the Proxima Centauri system.' },
            { category: '[POLITY]', title: 'G20 Summit Updates', content: 'Leaders discuss global economic recovery and climate goals in New Delhi.' }
        ],
        'Kannada': [
            { category: '[ರಾಜ್ಯ]', title: 'ಬೆಂಗಳೂರು ಮೆಟ್ರೋ ಹೊಸ ಲೈನ್', content: 'ಕೆಂಗೇರಿ ಮಾರ್ಗದಲ್ಲಿ ಮೆಟ್ರೋ ಸಂಚಾರ ಇಂದಿನಿಂದ ಆರಂಭ.' },
            { category: '[ವಿಜ್ಞಾನ]', title: 'ಇಸ್ರೋ ಸಾಧನೆ', content: 'ಚಂದ್ರಯಾನ-3 ಮಿಷನ್ ಯಶಸ್ವಿ ಪ್ರಯೋಗ.' }
        ],
        'Hindi': [
            { category: '[राष्ट्रीय]', title: 'नई शिक्षा नीति', content: 'सरकार ने स्कूलों के लिए नए पाठ्यक्रम की घोषणा की।' }
        ]
    };

    const current = sampleNews[lang] || sampleNews['English'];
    container.innerHTML = current.map(item => `
        <div class="news-item" style="margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
            <span style="font-size: 0.7rem; font-weight: 800; color: var(--primary);">${item.category}</span>
            <h3 style="margin-bottom: 0.5rem;">${item.title}</h3>
            <p style="color: var(--secondary);">${item.content}</p>
        </div>
    `).join('');
}

document.getElementById('news-lang').addEventListener('change', loadNews);

// 4. Notes Generation Logic
function generateNotes() {
    const topic = document.getElementById('note-topic').value;
    const isUPSC = document.getElementById('upsc-mode').checked;
    const resultDiv = document.getElementById('notes-result');
    
    if(!topic) return alert('Please enter a topic');

    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = `<div class="loading">Generating notes for "${topic}"...</div>`;

    // Simulate AI delay
    setTimeout(() => {
        resultDiv.innerHTML = `
            <h3>Comprehensive Notes: ${topic}</h3>
            <div style="margin-top: 1rem;">
                <p><strong>Introduction:</strong> ${topic} is a significant concept in modern educational studies. It involves several core principles and historical foundations.</p>
                <ul style="margin-left: 1.5rem; margin-top: 1rem;">
                    <li><strong>Key Component 1:</strong> Fundamental aspects and theories.</li>
                    <li><strong>Key Component 2:</strong> Practical applications in today's world.</li>
                    <li><strong>Challenges:</strong> Current limitations and future outlook.</li>
                </ul>
                ${isUPSC ? `<div style="margin-top: 1rem; border-left: 4px solid #4f46e5; padding-left: 1rem; font-style: italic;">
                    <strong>UPSC Mains Perspective:</strong> Critically analyze the evolution of ${topic} and its impact on public policy and constitutional ethics.
                </div>` : ''}
            </div>
            <button class="btn-primary mt-md" onclick="window.print()">Print Notes</button>
        `;
    }, 800);
}

// 5. Mock Test Engine
let currentQuestion = 0;
let score = 0;
const quizData = [
    {
        q: "Which planet is known as the Red Planet?",
        options: ["Earth", "Mars", "Jupiter", "Venus"],
        a: 1,
        exp: "Mars appears red due to iron oxide (rust) on its surface."
    },
    {
        q: "Who is the 'Father of the Indian Constitution'?",
        options: ["Mahatma Gandhi", "Dr. B.R. Ambedkar", "Jawaharlal Nehru", "Sardar Patel"],
        a: 1,
        exp: "Dr. B.R. Ambedkar was the chairman of the Drafting Committee."
    }
];

function startQuiz() {
    const topic = document.getElementById('quiz-topic').value;
    if(!topic) return alert('Enter a topic first');
    
    document.getElementById('quiz-config').classList.add('hidden');
    document.getElementById('quiz-active').classList.remove('hidden');
    currentQuestion = 0;
    score = 0;
    renderQuestion();
}

function renderQuestion() {
    const q = quizData[currentQuestion];
    document.getElementById('quiz-progress').textContent = `Question ${currentQuestion + 1} of ${quizData.length}`;
    document.getElementById('question-text').textContent = q.q;
    
    const container = document.getElementById('options-container');
    container.innerHTML = q.options.map((opt, idx) => `
        <button class="option-btn" onclick="handleAnswer(${idx})">${opt}</button>
    `).join('');
}

function handleAnswer(idx) {
    const q = quizData[currentQuestion];
    if(idx === q.a) score++;
    
    currentQuestion++;
    if(currentQuestion < quizData.length) {
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-results').classList.remove('hidden');
    document.getElementById('final-score').textContent = score;
}