const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestionsList');
const resultsContainer = document.getElementById('resultsContainer');
const trendingSection = document.getElementById('trendingSection');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const clearBtn = document.getElementById('clearBtn');
const voiceBtn = document.getElementById('voiceBtn');
const searchBtn = document.getElementById('searchBtn');

// ১. থিম টগল (Light / Dark)
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    themeToggleBtn.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
});

// ২. ইনপুট হ্যান্ডলিং ও ক্লিয়ার বাটন
searchInput.addEventListener('input', function() {
    const query = this.value.trim();
    clearBtn.style.display = query ? 'block' : 'none';

    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }

    fetchSuggestions(query);
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    suggestionsList.innerHTML = '';
    resultsContainer.innerHTML = '';
    trendingSection.style.display = 'block';
});

// ৩. লাইভ অটো-সাজেস্ট API
async function fetchSuggestions(query) {
    try {
        const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&q=${query}`)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        const suggestionsData = JSON.parse(data.contents);
        const suggestions = suggestionsData[1] || [];

        renderSuggestions(suggestions);
    } catch (err) {
        console.error(err);
    }
}

function renderSuggestions(suggestions) {
    suggestionsList.innerHTML = '';
    if (suggestions.length === 0) return;

    suggestions.slice(0, 5).forEach(term => {
        const li = document.createElement('li');
        li.innerHTML = `<span>🔍</span> <span>${term}</span>`;
        li.onclick = () => {
            searchInput.value = term;
            suggestionsList.innerHTML = '';
            executeSearch(term);
        };
        suggestionsList.appendChild(li);
    });
}

// ৪. ট্রেন্ডিং আইটেমে ক্লিক করলে সার্চ হওয়া
document.querySelectorAll('#trendingList li').forEach(item => {
    item.addEventListener('click', function() {
        const text = this.querySelector('span').textContent;
        searchInput.value = text;
        clearBtn.style.display = 'block';
        executeSearch(text);
    });
});

// ৫. সার্চ এক্সিকিউশন
async function executeSearch(queryStr) {
    const query = queryStr || searchInput.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) return;

    trendingSection.style.display = 'none';
    resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">Searching for "${query}"...</p>`;

    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&origin=*`);
        const data = await res.json();
        resultsContainer.innerHTML = '';

        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 6).forEach(topic => {
                if (topic.Text && topic.FirstURL) {
                    const card = document.createElement('div');
                    card.className = 'result-card';
                    card.innerHTML = `
                        <a href="${topic.FirstURL}" target="_blank">${topic.Text.split(' - ')[0]}</a>
                        <p>${topic.Text}</p>
                    `;
                    resultsContainer.appendChild(card);
                }
            });
        } else {
            resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">No results found.</p>`;
        }
    } catch (err) {
        resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">Error loading results.</p>`;
    }
}

searchBtn.addEventListener('click', () => executeSearch());
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});
