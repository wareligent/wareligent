const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestionsList');
const resultsWrapper = document.getElementById('resultsWrapper');
const trendingBox = document.getElementById('trendingBox');
const categoryTabs = document.getElementById('categoryTabs');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const clearBtn = document.getElementById('clearBtn');
const voiceBtn = document.getElementById('voiceBtn');

let selectedIndex = -1;
let debounceTimer;

// 1. Theme Switcher (Dark/Light)
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    themeIcon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
});

// 2. Input and Clear Button Handling
searchInput.addEventListener('input', function() {
    const query = this.value.trim();
    clearBtn.style.display = query ? 'block' : 'none';
    selectedIndex = -1;

    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
    }, 200);
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    suggestionsList.innerHTML = '';
    resultsWrapper.innerHTML = '';
    categoryTabs.style.display = 'none';
    trendingBox.style.display = 'block';
});

// 3. Keyboard Navigation (Arrow Up/Down, Enter)
searchInput.addEventListener('keydown', (e) => {
    const items = suggestionsList.querySelectorAll('li');
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length > 0) {
            selectedIndex = (selectedIndex + 1) % items.length;
            updateSelection(items);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length > 0) {
            selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            updateSelection(items);
        }
    } else if (e.key === 'Enter') {
        executeSearch();
    }
});

function updateSelection(items) {
    items.forEach((item, index) => {
        if (index === selectedIndex) {
            item.classList.add('selected');
            searchInput.value = item.dataset.val;
        } else {
            item.classList.remove('selected');
        }
    });
}

// 4. Real-time Auto-Suggest API
async function fetchSuggestions(query) {
    try {
        const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&q=${query}`)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        const suggestionsData = JSON.parse(data.contents);
        const suggestions = suggestionsData[1] || [];

        renderSuggestions(suggestions);
    } catch (err) {
        console.error("Suggestion Fetch Error:", err);
    }
}

function renderSuggestions(suggestions) {
    suggestionsList.innerHTML = '';
    if (suggestions.length === 0) return;

    suggestions.slice(0, 5).forEach((term) => {
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

// 5. Trending Items Click Event
document.querySelectorAll('.trend-item').forEach(item => {
    item.addEventListener('click', function() {
        const query = this.dataset.query;
        searchInput.value = query;
        clearBtn.style.display = 'block';
        executeSearch(query);
    });
});

// 6. Voice Search
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    voiceBtn.addEventListener('click', () => {
        recognition.start();
        voiceBtn.style.color = '#ef4444';
    });

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        searchInput.value = transcript;
        voiceBtn.style.color = '';
        executeSearch(transcript);
    };

    recognition.onend = () => { voiceBtn.style.color = ''; };
}

// 7. Search Execution and Results Display
async function executeSearch(queryStr) {
    // exact searched query capture
    const query = (typeof queryStr === 'string' && queryStr.trim() !== '') ? queryStr.trim() : searchInput.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) return;

    trendingBox.style.display = 'none';
    categoryTabs.style.display = 'flex';
    resultsWrapper.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Searching for "${query}"...</p>`;

    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&origin=*`);
        const data = await res.json();
        resultsWrapper.innerHTML = '';

        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 8).forEach(topic => {
                if (topic.Text && topic.FirstURL) {
                    const domain = new URL(topic.FirstURL).hostname;
                    const card = document.createElement('div');
                    card.className = 'result-card';
                    card.innerHTML = `
                        <div class="result-header">
                            <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" class="site-icon" alt="">
                            <span class="site-url">${domain}</span>
                        </div>
                        <a href="${topic.FirstURL}" target="_blank" class="result-title">${topic.Text.split(' - ')[0]}</a>
                        <p class="result-snippet">${topic.Text}</p>
                    `;
                    resultsWrapper.appendChild(card);
                }
            });
        } else {
            resultsWrapper.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No results found for "${query}".</p>`;
        }
    } catch (err) {
        resultsWrapper.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Failed to load search results. Please try again.</p>`;
    }
}
