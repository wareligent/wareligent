const searchInput = document.getElementById('searchInput');
const suggestionsList = document.getElementById('suggestionsList');
const resultsContainer = document.getElementById('resultsContainer');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');
const clearBtn = document.getElementById('clearBtn');

// ১. থিম টগল লজিক (Light / Dark)
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    
    if (document.body.classList.contains('dark-theme')) {
        themeIcon.textContent = '☀️';
    } else {
        themeIcon.textContent = '🌙';
    }
});

// ২. ডেমো ডাটাবেজ (পরের ধাপে এখানে API কল বসবে)
const mockData = [
    { title: "Wareligent Cloud Search Engine", desc: "Fast and smart search platform built on serverless architecture." },
    { title: "Google vs Bing Design Benchmarks", desc: "How modern high-end search engines structure UI and UX." },
    { title: "Hybrid Cloud Gaming", desc: "Stream games effortlessly without downloading files." }
];

// ৩. ইনপুট ট্র্যাকিং ও ক্লিয়ার বাটন
searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    clearBtn.style.display = query ? 'block' : 'none';
    suggestionsList.innerHTML = '';

    if (query.length > 0) {
        // এখানে পরবর্তী ধাপে আপনার Auto-Suggest API ইন্টিগ্রেট হবে
        const matches = mockData.filter(item => item.title.toLowerCase().includes(query));
        
        matches.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.title;
            li.onclick = () => {
                searchInput.value = item.title;
                suggestionsList.innerHTML = '';
                executeSearch(item.title);
            };
            suggestionsList.appendChild(li);
        });
    }
});

clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    suggestionsList.innerHTML = '';
    resultsContainer.innerHTML = '';
});

// ৪. সার্চ এগজিকিউশন
function executeSearch(queryStr) {
    const query = queryStr || searchInput.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) return;

    resultsContainer.innerHTML = '';
    const filtered = mockData.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.desc.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
        resultsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center;">No results found for "${query}"</p>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'result-item';
        card.innerHTML = `
            <a href="#">${item.title}</a>
            <p>${item.desc}</p>
        `;
        resultsContainer.appendChild(card);
    });
}

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') executeSearch();
});
