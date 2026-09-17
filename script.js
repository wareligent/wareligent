// --- 0. SUPABASE INTEGRATION ---
const SUPABASE_URL = "https://xveccsbdrysuiwyuvodw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HkyRE170ylT0kkdZxbwUSQ_ihHrS_Ra";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ডাটাবেজে সার্চ কিওয়ার্ড সেভ করার ফাংশন
async function saveSearchWordToDatabase(word) {
    if (!word) return;
    const cleanWord = word.trim().toLowerCase();

    // ফিল্টার: খালি, ডোমেইন নাম (.) বা ২ অক্ষরের ছোট কিওয়ার্ড বাদ যাবে
    if (!cleanWord || cleanWord.length < 2 || cleanWord.includes('.')) {
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from("search_suggestions")
            .upsert([{ keyword: cleanWord }], { onConflict: "keyword" });

        if (error) {
            console.error("Supabase Error:", error.message);
        } else {
            console.log("Saved to database:", cleanWord);
        }
    } catch (err) {
        console.error("Database Save Error:", err);
    }
}

// --- DOM ELEMENTS ---
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

// 4. Real-time Auto-Suggest API (JSONP Method)
function fetchSuggestions(query) {
    const oldScript = document.getElementById('jsonp-suggestions');
    if (oldScript) oldScript.remove();

    window.handleGoogleSuggestions = function(data) {
        const suggestions = (data && data[1]) ? data[1] : [];
        renderSuggestions(suggestions);
    };

    const script = document.createElement('script');
    script.id = 'jsonp-suggestions';
    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}&callback=handleGoogleSuggestions`;
    script.onerror = () => renderSuggestions([]);
    
    document.body.appendChild(script);
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

// 7. Search Execution, Database Saving and Smart Website Redirection
async function executeSearch(queryStr) {
    const query = (typeof queryStr === 'string' && queryStr.trim() !== '') ? queryStr.trim() : searchInput.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) return;

    // ১. সুপাবেস ডাটাবেজে কিউয়ার্ড সেভ করা
    await saveSearchWordToDatabase(query);

    // ২. চেক করা ইউজার সরাসরি ডোমেইন নাম বা URL লিখেছেন কি না (যেমন: facebook.com, http://example.com)
    const isDomain = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(query);
    const hasProtocol = /^https?:\/\//i.test(query);

    if (isDomain || hasProtocol) {
        let finalUrl = query;
        if (!hasProtocol) {
            finalUrl = `https://${query}`;
        }
        window.open(finalUrl, '_blank');
        return;
    }

    // ৩. সাধারণ সার্চ কিওয়ার্ড প্রসেসিং
    trendingBox.style.display = 'none';
    categoryTabs.style.display = 'flex';
    resultsWrapper.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Searching for "${query}"...</p>`;

    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    try {
        const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&origin=*`);
        const data = await res.json();
        resultsWrapper.innerHTML = '';

        // ইনস্ট্যান্ট অ্যান্সার / উইকিপিডিয়া কার্ড
        if (data.AbstractText) {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `
                <div class="result-header">
                    <img src="https://www.google.com/s2/favicons?domain=${new URL(data.AbstractURL).hostname}&sz=32" class="site-icon" alt="">
                    <span class="site-url">${data.AbstractSource || 'Instant Answer'}</span>
                </div>
                <a href="${data.AbstractURL}" target="_blank" class="result-title">${data.Heading || query}</a>
                <p class="result-snippet">${data.AbstractText}</p>
            `;
            resultsWrapper.appendChild(card);
        }

        // সম্পর্কিত টপিক বা ওয়েবসাইট লিংক কার্ড
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 5).forEach(topic => {
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
        }

        if (resultsWrapper.innerHTML === '') {
            resultsWrapper.innerHTML = `
                <p style="color: var(--text-secondary); text-align: center; padding: 20px;">
                    No instant overview available. <br>
                    <a href="${googleSearchUrl}" target="_blank" style="color: var(--accent-color); text-decoration: underline;">
                        Click here to search on Google
                    </a>
                </p>`;
        }
    } catch (err) {
        resultsWrapper.innerHTML = `
            <p style="color: var(--text-secondary); text-align: center; padding: 20px;">
                <a href="${googleSearchUrl}" target="_blank" style="color: var(--accent-color); text-decoration: underline;">
                    Search "${query}" on Google
                </a>
            </p>`;
    }
            }
