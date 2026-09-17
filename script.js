const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestionsList');
const resultsContainer = document.getElementById('resultsContainer');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const clearBtn = document.getElementById('clearBtn');

// ১. থিম টগল (Light / Dark)
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    
    themeIcon.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
});

// ২. ডিবাউন্স (Debounce) ফংশন (সার্ভারে অতিরিক্ত API কল বন্ধ করতে)
let debounceTimer;

searchInput.addEventListener('input', function() {
    const query = this.value.trim();
    clearBtn.style.display = query ? 'block' : 'none';

    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }

    // ইউজার টাইপ থামানোর ৩০০ মিলি-সেকেন্ড পর API কল হবে
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchRealtimeSuggestions(query);
    }, 300);
});

// ৩. রিয়েল-টাইম অটো-সাজেস্ট API কল
async function fetchRealtimeSuggestions(query) {
    try {
        // Google Auto-complete Public API (CORS Bypass সহ)
        const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://suggestqueries.google.com/complete/search?client=firefox&q=${query}`)}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // API ডাটা পার্স করা
        const suggestionsData = JSON.parse(data.contents);
        const suggestions = suggestionsData[1] || [];

        renderSuggestions(suggestions);
    } catch (error) {
        console.error("Suggestions fetch error:", error);
    }
}

// ৪. ড্রপডাউনে সাজেশন দেখানো
function renderSuggestions(suggestions) {
    suggestionsList.innerHTML = '';

    if (suggestions.length === 0) return;

    suggestions.slice(0, 6).forEach(term => {
        const li = document.createElement('li');
        li.innerHTML = `🔍 <span>${term}</span>`;
        
        li.onclick = () => {
            searchInput.value = term;
            suggestionsList.innerHTML = '';
            executeSearch(term);
        };
        suggestionsList.appendChild(li);
    });
}

// ৫. ক্লিয়ার বাটন লজিক
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    suggestionsList.innerHTML = '';
    resultsContainer.innerHTML = '';
});

// ৬. সার্চ এক্সিকিউশন (DuckDuckGo API দিয়ে আসল রেজাল্ট আনা)
async function executeSearch(queryStr) {
    const query = queryStr || searchInput.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) return;

    resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">খোঁজা হচ্ছে...</p>`;

    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&origin=*`);
        const data = await res.json();

        resultsContainer.innerHTML = '';

        if (data.AbstractText) {
            const card = document.createElement('div');
            card.className = 'result-item';
            card.innerHTML = `
                <a href="${data.AbstractURL}" target="_blank">${data.Heading}</a>
                <p>${data.AbstractText}</p>
            `;
            resultsContainer.appendChild(card);
        } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 5).forEach(topic => {
                if (topic.Text && topic.FirstURL) {
                    const card = document.createElement('div');
                    card.className = 'result-item';
                    card.innerHTML = `
                        <a href="${topic.FirstURL}" target="_blank">${topic.Text.split(' - ')[0]}</a>
                        <p>${topic.Text}</p>
                    `;
                    resultsContainer.appendChild(card);
                }
            });
        } else {
            resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">"${query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি।</p>`;
        }
    } catch (err) {
        resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">ফলাফল লোড করতে সমস্যা হয়েছে।</p>`;
    }
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});
