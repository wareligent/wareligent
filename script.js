const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestionsList');
const resultsContainer = document.getElementById('resultsContainer');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const clearBtn = document.getElementById('clearBtn');
const voiceBtn = document.getElementById('voiceBtn');
const searchTabs = document.getElementById('searchTabs');

let selectedSuggestionIndex = -1;
let debounceTimer;

// ১. থিম টগল
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    themeIcon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
});

// ২. কিবোর্ড দিয়ে সাজেশন নেভিগেশন (Arrow Up/Down, Esc)
searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsList.querySelectorAll('li');
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
            selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
            updateSelectedSuggestion(items);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
            selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
            updateSelectedSuggestion(items);
        }
    } else if (e.key === 'Escape') {
        suggestionsList.innerHTML = '';
        selectedSuggestionIndex = -1;
    }
});

function updateSelectedSuggestion(items) {
    items.forEach((item, idx) => {
        if (idx === selectedSuggestionIndex) {
            item.classList.add('selected');
            searchInput.value = item.dataset.val;
        } else {
            item.classList.remove('selected');
        }
    });
}

// ৩. অটো-সাজেস্ট
searchInput.addEventListener('input', function() {
    const query = this.value.trim();
    clearBtn.style.display = query ? 'block' : 'none';
    selectedSuggestionIndex = -1;

    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchRealtimeSuggestions(query);
    }, 250);
});

async function fetchRealtimeSuggestions(query) {
    try {
        const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&q=${query}`)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        const suggestionsData = JSON.parse(data.contents);
        const suggestions = suggestionsData[1] || [];

        renderSuggestions(suggestions);
    } catch (error) {
        console.error("Suggestions error:", error);
    }
}

function renderSuggestions(suggestions) {
    suggestionsList.innerHTML = '';
    if (suggestions.length === 0) return;

    suggestions.slice(0, 6).forEach((term) => {
        const li = document.createElement('li');
        li.dataset.val = term;
        li.innerHTML = `<span>🔍</span> ${term}`;
        li.onclick = () => {
            searchInput.value = term;
            suggestionsList.innerHTML = '';
            executeSearch(term);
        };
        suggestionsList.appendChild(li);
    });
}

// ৪. ভয়েস সার্চ (Voice Search Feature)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.style.color = '#ea4335';
    });

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        searchInput.value = transcript;
        voiceBtn.style.color = '';
        executeSearch(transcript);
    };

    recognition.onerror = () => { voiceBtn.style.color = ''; };
    recognition.onend = () => { voiceBtn.style.color = ''; };
} else {
    voiceBtn.style.display = 'none';
}

// ৫. সার্চ ফুল ফাংশনাল এক্সিকিউশন
async function executeSearch(queryStr) {
    const query = queryStr || searchInput.value.trim();
    suggestionsList.innerHTML = '';
    if (!query) return;

    searchTabs.style.display = 'flex';
    resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">Wareligent খুঁজছে...</p>`;

    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&origin=*`);
        const data = await res.json();
        resultsContainer.innerHTML = '';

        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 8).forEach(topic => {
                if (topic.Text && topic.FirstURL) {
                    const domain = new URL(topic.FirstURL).hostname;
                    const card = document.createElement('div');
                    card.className = 'result-item';
                    card.innerHTML = `
                        <div class="result-site-info">
                            <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" class="site-icon" alt="">
                            <span class="site-url">${domain}</span>
                        </div>
                        <a href="${topic.FirstURL}" target="_blank">${topic.Text.split(' - ')[0]}</a>
                        <p>${topic.Text}</p>
                    `;
                    resultsContainer.appendChild(card);
                }
            });
        } else {
            resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">"${query}" এর জন্য কোন তথ্য পাওয়া যায়নি।</p>`;
        }
    } catch (err) {
        resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">সার্চ প্রসেস করতে সমস্যা তৈরি হয়েছে।</p>`;
    }
}

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    suggestionsList.innerHTML = '';
    resultsContainer.innerHTML = '';
    searchTabs.style.display = 'none';
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});
