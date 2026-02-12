// ============================================
// DUDLEY MAGPIES - APP.JS
// All data feeds + animations preserved
// ============================================

// CONFIG - Data feed URLs
const CONFIG = {
    // Ground status (Google Apps Script)
    groundStatusUrl: 'https://script.google.com/macros/s/AKfycby_kAXDcQKQ1tJQmRCii91iXPn-mxB0hRq6NTf09U1nUMt9nt0xjjy1oTo0hiLx8af-/exec',
    groundStatusDetailsUrl: '#about',
    
    // Results feed (Apify)
    apifyResultsUrl: 'https://api.apify.com/v2/datasets/yoBLwX2yoAmMG6N8e/items?clean=true&format=json&limit=1000',
    
    // Local data files
    featsJsonUrl: 'feats.json',
    sponsorsJsonUrl: 'sponsors.json',
    gamesJsonUrl: 'games.json',
    
    // Media
    promoVideoSrc: 'img/smashcut.mp4',
    fallbackLogo: 'img/dudley-logo.png'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Cache helper
const cache = {
    set: (key, data, ttlMinutes) => {
        const item = {
            data,
            expiry: Date.now() + (ttlMinutes * 60 * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const parsed = JSON.parse(item);
        if (Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    }
};

// Date formatter
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-AU', options);
};

// Check if date is today
const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

// Team label formatter
const formatTeamLabel = (teamName) => {
    const match = teamName.match(/(?:U|Under\s*)(\d+)/i);
    if (match) {
        const age = match[1];
        const divMatch = teamName.match(/Div(?:ision)?\s*(\d+)/i);
        return divMatch ? `U${age} Div ${divMatch[1]}` : `U${age}`;
    }
    return teamName;
};

// ============================================
// MOBILE NAVIGATION
// ============================================

const initMobileNav = () => {
    const toggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.nav-menu');
    
    if (!toggle || !menu) return;
    
    toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        toggle.classList.toggle('active');
    });
    
    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.classList.remove('active');
        });
    });
    
    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('active');
            toggle.classList.remove('active');
        }
    });
};

// ============================================
// GROUND STATUS FEED
// ============================================

const loadGroundStatus = async () => {
    try {
        const response = await fetch(CONFIG.groundStatusUrl);
        const data = await response.json();
        
        if (data.is_closed) {
            showGroundStatusBanner(data);
            setTickerClosedState(data);
        }
    } catch (error) {
        console.log('Ground status check failed:', error);
    }
};

const showGroundStatusBanner = (data) => {
    const banner = document.getElementById('groundStatusBanner');
    if (!banner) return;
    
    const message = document.getElementById('bannerMessage');
    const updated = document.getElementById('bannerUpdated');
    
    if (message) message.textContent = data.note || 'Ground is currently closed';
    if (updated && data.updatedAt) updated.textContent = `Updated: ${data.updatedAt}`;
    
    banner.classList.remove('hidden');
};

const setTickerClosedState = (data) => {
    const ticker = document.getElementById('scoreTicker');
    const tickerTrack = document.getElementById('tickerTrack');
    
    if (!ticker || !tickerTrack) return;
    
    ticker.classList.add('closed');
    tickerTrack.innerHTML = `
        <div class="ticker-item">
            <span class="ticker-matchup">⚠️ ${data.note || 'GROUND CLOSED'}</span>
        </div>
    `;
};

// ============================================
// RESULTS FEED (APIFY)
// ============================================

const loadResults = async () => {
    try {
        // Check cache first
        const cached = cache.get('dudley_apify_results_v1');
        const results = cached || await fetchResults();
        
        if (!cached) cache.set('dudley_apify_results_v1', results, 30);
        
        populateTicker(results);
        populateResultsTable(results);
        
    } catch (error) {
        console.error('Results load failed:', error);
    }
};

const fetchResults = async () => {
    const response = await fetch(CONFIG.apifyResultsUrl);
    return await response.json();
};

const populateTicker = (results) => {
    const tickerTrack = document.getElementById('tickerTrack');
    if (!tickerTrack) return;
    
    // Get latest result per team
    const dudleyResults = results
        .filter(r => /dudley redhead/i.test(r.home) || /dudley redhead/i.test(r.away))
        .sort((a, b) => new Date(b.date_iso || b.date) - new Date(a.date_iso || a.date));
    
    // Get unique teams (latest result each)
    const teamResults = [];
    const seenTeams = new Set();
    
    dudleyResults.forEach(result => {
        const teamName = /dudley redhead/i.test(result.home) ? result.home : result.away;
        const label = formatTeamLabel(teamName);
        
        if (!seenTeams.has(label)) {
            seenTeams.add(label);
            teamResults.push({ ...result, label });
        }
    });
    
    // Build ticker items
    const tickerItems = teamResults.slice(0, 10).map(result => {
        const score = result.score || 'TBD';
        return `
            <div class="ticker-item">
                <span class="ticker-grade">${result.label}</span>
                <span class="ticker-matchup">${result.home} vs ${result.away}</span>
                <span class="ticker-score">${score}</span>
            </div>
        `;
    }).join('');
    
    // Duplicate for seamless loop
    tickerTrack.innerHTML = tickerItems + tickerItems;
};

const populateResultsTable = (results) => {
    const tbody = document.getElementById('resultsTbody');
    if (!tbody) return;
    
    const dudleyResults = results
        .filter(r => /dudley redhead/i.test(r.home) || /dudley redhead/i.test(r.away))
        .sort((a, b) => new Date(b.date_iso || b.date) - new Date(a.date_iso || a.date))
        .slice(0, 50);
    
    tbody.innerHTML = dudleyResults.map(result => {
        const date = new Date(result.date_iso || result.date);
        const dateStr = date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
        const teamName = /dudley redhead/i.test(result.home) ? result.home : result.away;
        const label = formatTeamLabel(teamName);
        const score = result.score || '-';
        
        return `
            <tr>
                <td class="result-date">${dateStr}</td>
                <td class="result-grade">${label}</td>
                <td class="result-match">${result.home} vs ${result.away}</td>
                <td class="result-score">${score}</td>
            </tr>
        `;
    }).join('');
};

// ============================================
// UPCOMING GAMES
// ============================================

const loadGames = async () => {
    try {
        // Check cache
        const cached = cache.get('dudley_games_cache_v1');
        let games = cached;
        
        if (!games) {
            try {
                const response = await fetch(CONFIG.gamesJsonUrl);
                games = await response.json();
                cache.set('dudley_games_cache_v1', games, 360); // 6 hours
            } catch {
                // Fallback to sample data
                const sampleScript = document.getElementById('sample-games');
                games = sampleScript ? JSON.parse(sampleScript.textContent) : [];
            }
        }
        
        populateGames(games);
        checkGameday(games);
        updateNextGameStat(games);
        
    } catch (error) {
        console.error('Games load failed:', error);
    }
};

const populateGames = (games) => {
    const gameList = document.getElementById('gameList');
    if (!gameList) return;
    
    const upcoming = games
        .filter(g => new Date(g.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
    
    if (upcoming.length === 0) {
        gameList.innerHTML = '<p>No upcoming games scheduled. Check back soon!</p>';
        return;
    }
    
    gameList.innerHTML = upcoming.map(game => `
        <div class="game-card">
            <div class="game-date">${formatDate(game.date)}</div>
            <div class="game-matchup">
                ${game.homeAway === 'Home' ? 'vs' : '@'} ${game.opponent}
            </div>
            <div class="game-details">
                <span class="game-location">${game.homeAway}</span>
                <span class="game-venue">${game.venue}</span>
            </div>
        </div>
    `).join('');
};

const checkGameday = (games) => {
    const badge = document.getElementById('gameday-badge');
    if (!badge) return;
    
    const hasGameToday = games.some(g => isToday(g.date));
    if (hasGameToday) {
        badge.classList.remove('hidden');
    }
};

const updateNextGameStat = (games) => {
    const stat = document.getElementById('nextGameQuick');
    if (!stat) return;
    
    const nextGame = games
        .filter(g => new Date(g.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    
    if (nextGame) {
        const date = new Date(nextGame.date);
        const dateStr = date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
        stat.textContent = dateStr;
    } else {
        stat.textContent = 'TBA';
    }
};

// ============================================
// CLUB HIGHLIGHTS (FEATS)
// ============================================

const loadFeats = async () => {
    try {
        const response = await fetch(CONFIG.featsJsonUrl);
        const data = await response.json();
        populateFeats(data.items.slice(0, 5));
    } catch (error) {
        console.error('Feats load failed:', error);
    }
};

const populateFeats = (items) => {
    const featsRow = document.getElementById('featsRow');
    if (!featsRow) return;
    
    featsRow.innerHTML = items.map(item => `
        <div class="feat-card">
            <img src="${item.image_url}" alt="${item.title}" class="feat-image" loading="lazy">
            <div class="feat-content">
                ${item.tag ? `<span class="feat-tag">${item.tag}</span>` : ''}
                <h3 class="feat-title">${item.title}</h3>
                <p class="feat-subtitle">${item.subtitle}</p>
                ${item.primary_link_url ? `
                    <a href="${item.primary_link_url}" class="feat-link" target="_blank">
                        ${item.primary_link_text || 'Learn More'}
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
};

// ============================================
// SPONSORS MARQUEE
// ============================================

const loadSponsors = async () => {
    try {
        const response = await fetch(CONFIG.sponsorsJsonUrl);
        const data = await response.json();
        populateSponsors(data);
    } catch (error) {
        console.error('Sponsors load failed:', error);
    }
};

const populateSponsors = (sponsors) => {
    const track1 = document.getElementById('sponsorsTrack1');
    
    if (!track1) return;
    
    const sponsorItems = sponsors.map(sponsor => {
        const logo = sponsor.logo || CONFIG.fallbackLogo;
        return `
            <div class="sponsor-item">
                <img src="${logo}" alt="${sponsor.name}" class="sponsor-logo">
            </div>
        `;
    }).join('');
    
    // Duplicate for seamless scroll
    track1.innerHTML = sponsorItems + sponsorItems;
};

// ============================================
// ANIMATIONS (GSAP)
// ============================================

const initAnimations = () => {
    // Only init if GSAP loaded
    if (typeof gsap === 'undefined') return;
    
    initBallAnimation();
    init3DCard();
};

const initBallAnimation = () => {
    const ball = document.getElementById('ball');
    const ballAnchor = document.getElementById('ballAnchor');
    
    if (!ball || !ballAnchor) return;
    
    // Ball kick through goals on scroll
    gsap.to(ball, {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
        },
        y: -400,
        rotation: 720,
        scale: 0.5,
        ease: 'power2.out'
    });
    
    gsap.to(ballAnchor, {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
        },
        y: -200,
        ease: 'power2.out'
    });
};

const init3DCard = () => {
    const card = document.getElementById('footyCard');
    if (!card) return;
    
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        gsap.to(card, {
            rotationX: rotateX,
            rotationY: rotateY,
            duration: 0.3,
            ease: 'power2.out'
        });
        
        // Parallax character
        const character = card.querySelector('.card-character');
        if (character) {
            gsap.to(character, {
                x: (x - centerX) / 20,
                y: (y - centerY) / 20,
                duration: 0.3,
                ease: 'power2.out'
            });
        }
    });
    
    card.addEventListener('mouseleave', () => {
        gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            duration: 0.5,
            ease: 'power2.out'
        });
        
        const character = card.querySelector('.card-character');
        if (character) {
            gsap.to(character, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    });
};

// ============================================
// FOOTER AUTO-YEAR
// ============================================

const setFooterYear = () => {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
};

// ============================================
// INIT APP
// ============================================

const init = async () => {
    // Set footer year immediately
    setFooterYear();
    
    // Init mobile nav
    initMobileNav();
    
    // Load all data feeds
    await Promise.all([
        loadGroundStatus(),
        loadResults(),
        loadGames(),
        loadFeats(),
        loadSponsors()
    ]);
    
    // Init animations after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }
};

// Start the app
init();
