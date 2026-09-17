const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const suggestionsList = document.getElementById('suggestionsList');
const resultsContainer = document.getElementById('resultsContainer');

// ডেমো ডেটাবেজ
const database = [
    { title: "Wareligent Cloud Search", desc: "Next-gen distributed search platform powered by Wareligent." },
    { title: "Hybrid Cloud Gaming", desc: "Stream high-end PC and mobile games with zero latency." },
    { title: "Vercel Deployment Guide", desc: "How to deploy static websites and APIs instantly on Vercel." },
    { title: "GitHub Code Repository", desc: "Manage software project source code easily on GitHub." }
];

// ১. ইনপুট ড্রপডাউন সাজেশন
searchInput.addEventListener('input', function() {
    const val = this.value.trim().toLowerCase();
    suggestionsList.innerHTML = '';

    if (val.length > 0) {
        const matches = database.filter(item => item.title.toLowerCase().includes(val));
        
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

// ২. সার্চ ট্রিগার
function executeSearch(queryStr) {
    const query = queryStr || searchInput.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) return;

    resultsContainer.innerHTML = '';
    const filtered = database.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.desc.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
        resultsContainer.innerHTML = `<p style="color: #64748b; text-align: center;">No results found for "${query}"</p>`;
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

searchBtn.addEventListener('click', () => executeSearch());

searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        executeSearch();
    }
});
