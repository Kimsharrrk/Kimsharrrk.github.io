/* ==============================
   main.js — Interactions & Logic
   ============================== */

// ── Custom Cursor ──────────────────────────────
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
});

// Ring follows with slight delay
(function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
})();

// Hover effect
document.querySelectorAll('a, button, .project-card, .stack-item, .filter-btn, .repo-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
});

// ── Header scroll ──────────────────────────────
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// ── GSAP Scroll Reveals ────────────────────────
gsap.registerPlugin(ScrollTrigger);

const revealTargets = [
    '.hero-tag', '.hero-title', '.hero-desc', '.btn-group', '.hero-avatar',
];
gsap.from(revealTargets, {
    y: 30, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'power2.out', delay: 0.1
});

document.querySelectorAll('section:not(.hero)').forEach(section => {
    const targets = section.querySelectorAll(
        '.section-label, .section-title, .section-desc, .stack-card, .carousel-outer, .edu-row, .edu-category-label, .edu-divider, .github-filter, .repo-grid, .ending h2, .ending p, .ending .btn'
    );
    if (!targets.length) return;
    gsap.from(targets, {
        scrollTrigger: { trigger: section, start: 'top 80%' },
        y: 36, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out'
    });
});

// ── Carousel: Marquee + Drag ───────────────────
function initCarousel(trackEl) {
    if (!trackEl) return;
    
    let isDragging = false;
    let startX = 0;
    let scrollLeft = 0;
    let dragOffset = 0;
    let currentTranslate = 0;

    // Parse current animation translate to pick up where it left off
    function getCurrentTranslate() {
        const style = window.getComputedStyle(trackEl);
        const matrix = new WebKitCSSMatrix(style.transform);
        return matrix.m41; // translateX
    }

    const onDragStart = (e) => {
        isDragging = true;
        trackEl.classList.add('paused', 'dragging');
        currentTranslate = getCurrentTranslate();
        trackEl.style.transform = `translateX(${currentTranslate}px)`;
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        dragOffset = 0;
    };

    const onDragMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = (e.touches ? e.touches[0].clientX : e.clientX);
        dragOffset = x - startX;
        trackEl.style.transform = `translateX(${currentTranslate + dragOffset}px)`;
    };

    const onDragEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        // Snap the CSS animation to continue from this point
        const finalX = currentTranslate + dragOffset;
        // Compute half-width for looping boundary
        const halfW = trackEl.scrollWidth / 2;
        
        // Normalize: keep in [−halfW, 0]
        let normalized = ((finalX % halfW) - halfW) % halfW;
        if (normalized > 0) normalized -= halfW;
        
        // Set a custom property for the animation to restart from
        trackEl.style.setProperty('--drag-start', normalized + 'px');
        trackEl.style.transform = '';
        trackEl.classList.remove('dragging');
        
        // Short pause then resume
        setTimeout(() => { trackEl.classList.remove('paused'); }, 50);
    };

    // Mouse events
    trackEl.addEventListener('mousedown', onDragStart);
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);

    // Touch events
    trackEl.addEventListener('touchstart', onDragStart, { passive: true });
    trackEl.addEventListener('touchmove', onDragMove, { passive: false });
    trackEl.addEventListener('touchend', onDragEnd);

    // Pause on hover (not during drag)
    trackEl.addEventListener('mouseenter', () => { if (!isDragging) trackEl.classList.add('paused'); });
    trackEl.addEventListener('mouseleave', () => { if (!isDragging) trackEl.classList.remove('paused'); });
}

document.querySelectorAll('.carousel-track').forEach(track => initCarousel(track));

// ── GitHub Repos ────────────────────────────────
const GITHUB_USER = 'Kimsharrrk';
let allRepos = [];

const LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#2b7489', Python: '#3572A5',
    Swift: '#F05138', HTML: '#e34c26', CSS: '#563d7c', 'C++': '#f34b7d',
    null: '#cccccc'
};

async function fetchRepos() {
    const container = document.getElementById('repo-grid');
    try {
        container.innerHTML = '<p class="repo-loading">불러오는 중...</p>';
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=50&sort=updated`);
        if (!res.ok) throw new Error('GitHub API error');
        allRepos = await res.json();
        renderRepos('all');
        buildFilters();
    } catch(err) {
        container.innerHTML = `<p class="repo-loading">저장소를 불러올 수 없습니다.</p>`;
        console.error(err);
    }
}

function buildFilters() {
    const langs = [...new Set(allRepos.map(r => r.language).filter(Boolean))];
    const filterBar = document.getElementById('github-filters');
    
    langs.forEach(lang => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = lang;
        btn.dataset.lang = lang;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderRepos(lang);
        });
        filterBar.appendChild(btn);
    });
}

function renderRepos(filter) {
    const container = document.getElementById('repo-grid');
    const filtered = filter === 'all' ? allRepos : allRepos.filter(r => r.language === filter);
    
    if (!filtered.length) {
        container.innerHTML = '<p class="repo-loading">저장소가 없습니다.</p>';
        return;
    }

    container.innerHTML = filtered.map(repo => {
        const lang = repo.language;
        const color = LANG_COLORS[lang] || '#cccccc';
        const updatedAt = new Date(repo.updated_at);
        const dateStr = `${updatedAt.getFullYear()}.${String(updatedAt.getMonth()+1).padStart(2,'0')}`;
        
        return `
        <a href="${repo.html_url}" target="_blank" class="repo-card">
            <div class="repo-name">${repo.name}</div>
            <div class="repo-desc">${repo.description || repo.name}</div>
            <div class="repo-meta">
                <span class="repo-meta-item">📅 ${dateStr}</span>
                ${lang ? `<span class="repo-meta-item"><span class="repo-lang-dot" style="background:${color}"></span>${lang}</span>` : ''}
                <span class="repo-meta-item">⭐ ${repo.stargazers_count}</span>
                <span class="repo-meta-item">🍴 ${repo.forks_count}</span>
            </div>
        </a>`;
    }).join('');
    
    // Re-apply hover cursor for new cards
    container.querySelectorAll('.repo-card').forEach(el => {
        el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
        el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
    });
}

// Init
document.getElementById('filter-all').addEventListener('click', e => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderRepos('all');
});

fetchRepos();
