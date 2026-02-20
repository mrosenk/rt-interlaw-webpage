/**
 * Contentful Integration - Kanzlei Rosenkranz-Tittl
 * Lädt Urlaubs-Banner und Blog-Artikel aus Contentful.
 *
 * Content Delivery API (read-only, öffentlich) — kein Secret im Frontend.
 */

const CONTENTFUL_SPACE_ID  = 'c3w4lxf5mhpv';
const CONTENTFUL_ACCESS_TOKEN = 'EJA4jvVzgJZaChIdhtHWWbECJb0xsEj-t8nOPlyhNJ8';
const CONTENTFUL_API_BASE  = `https://cdn.contentful.com/spaces/${CONTENTFUL_SPACE_ID}/environments/master`;

// ─────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────

async function contentfulFetch(endpoint) {
    const url = `${CONTENTFUL_API_BASE}${endpoint}&access_token=${CONTENTFUL_ACCESS_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Contentful API Fehler: ${res.status}`);
    return res.json();
}

function getCurrentLanguage() {
    return document.documentElement.lang || 'de';
}

function formatDatum(dateString, lang) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return lang === 'cs'
        ? date.toLocaleDateString('cs-CZ', opts)
        : date.toLocaleDateString('de-DE', opts);
}

/** Wandelt Contentful Rich Text (document) in einfaches HTML um */
function richTextToHtml(document) {
    if (!document || !document.content) return '';

    const renderNode = (node) => {
        if (!node) return '';
        switch (node.nodeType) {
            case 'document':
                return node.content.map(renderNode).join('');
            case 'paragraph':
                return `<p>${node.content.map(renderNode).join('')}</p>`;
            case 'heading-1':
                return `<h1>${node.content.map(renderNode).join('')}</h1>`;
            case 'heading-2':
                return `<h2>${node.content.map(renderNode).join('')}</h2>`;
            case 'heading-3':
                return `<h3>${node.content.map(renderNode).join('')}</h3>`;
            case 'unordered-list':
                return `<ul>${node.content.map(renderNode).join('')}</ul>`;
            case 'ordered-list':
                return `<ol>${node.content.map(renderNode).join('')}</ol>`;
            case 'list-item':
                return `<li>${node.content.map(renderNode).join('')}</li>`;
            case 'blockquote':
                return `<blockquote>${node.content.map(renderNode).join('')}</blockquote>`;
            case 'hr':
                return '<hr>';
            case 'hyperlink':
                return `<a href="${node.data.uri}" target="_blank" rel="noopener">${node.content.map(renderNode).join('')}</a>`;
            case 'text': {
                let text = node.value
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
                if (node.marks) {
                    node.marks.forEach(m => {
                        if (m.type === 'bold')   text = `<strong>${text}</strong>`;
                        if (m.type === 'italic') text = `<em>${text}</em>`;
                        if (m.type === 'code')   text = `<code>${text}</code>`;
                    });
                }
                return text;
            }
            default:
                return node.content ? node.content.map(renderNode).join('') : '';
        }
    };

    return renderNode(document);
}

// ─────────────────────────────────────────────
// URLAUBS-BANNER
// ─────────────────────────────────────────────

async function loadUrlaubsBanner() {
    // sessionStorage: Banner bleibt weg wenn Nutzer ihn schließt
    if (sessionStorage.getItem('urlaubsBannerClosed') === 'true') return;

    try {
        const data = await contentfulFetch(
            `/entries?content_type=urlaubsBanner&limit=1&`
        );

        if (!data.items || data.items.length === 0) return;

        const fields = data.items[0].fields;
        if (!fields.aktiv) return;

        const lang     = getCurrentLanguage();
        const vonDatum = formatDatum(fields.vonDatum, lang);
        const bisDatum = formatDatum(fields.bisDatum, lang);

        let nachricht = lang === 'cs'
            ? (fields.nachrichtCZ || '')
            : (fields.nachrichtDE || '');

        nachricht = nachricht
            .replace('{von}', vonDatum)
            .replace('{bis}', bisDatum);

        renderUrlaubsBanner(nachricht);

    } catch (e) {
        // Kein Fehler anzeigen — Banner ist optional
        console.warn('Urlaubs-Banner konnte nicht geladen werden:', e.message);
    }
}

function renderUrlaubsBanner(nachricht) {
    const banner = document.createElement('div');
    banner.className = 'urlaubs-banner';
    banner.setAttribute('role', 'alert');
    banner.innerHTML = `
        <div class="container">
            <div class="urlaubs-banner__content">
                <svg class="urlaubs-banner__icon" xmlns="http://www.w3.org/2000/svg"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span class="urlaubs-banner__text">${nachricht}</span>
                <button class="urlaubs-banner__close" aria-label="Schließen">&times;</button>
            </div>
        </div>
    `;

    banner.style.cssText = `
        background: linear-gradient(135deg, #c9a227 0%, #a88720 100%);
        color: #1a365d;
        padding: 0.75rem 0;
        position: relative;
        z-index: 1001;
        font-size: 0.9rem;
        font-weight: 500;
    `;

    const content = banner.querySelector('.urlaubs-banner__content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        text-align: center;
    `;

    const icon = banner.querySelector('.urlaubs-banner__icon');
    icon.style.cssText = 'width: 20px; height: 20px; flex-shrink: 0;';

    const closeBtn = banner.querySelector('.urlaubs-banner__close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #1a365d;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0 0.5rem;
        line-height: 1;
        opacity: 0.7;
        transition: opacity 0.2s;
    `;
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.7');
    closeBtn.addEventListener('click', () => {
        banner.remove();
        sessionStorage.setItem('urlaubsBannerClosed', 'true');
        const header = document.querySelector('.header');
        if (header) header.style.top = '';
    });

    document.body.insertBefore(banner, document.body.firstChild);

    const header = document.querySelector('.header');
    if (header) {
        requestAnimationFrame(() => {
            header.style.top = banner.offsetHeight + 'px';
        });
    }
}

// ─────────────────────────────────────────────
// BLOG
// ─────────────────────────────────────────────

async function loadBlogArtikel({ limit = 100, kategorie = null } = {}) {
    let filter = `content_type=blogArtikel&order=-fields.datum&limit=${limit}&`;
    if (kategorie) filter += `fields.kategorie=${encodeURIComponent(kategorie)}&`;

    const data = await contentfulFetch(`/entries?${filter}`);

    // Assets für Titelbilder in Map ablegen
    const assetMap = {};
    if (data.includes && data.includes.Asset) {
        data.includes.Asset.forEach(asset => {
            assetMap[asset.sys.id] = asset.fields;
        });
    }

    return (data.items || []).map(item => {
        const f = item.fields;
        const bildId = f.titelbild?.sys?.id;
        const bild = bildId ? assetMap[bildId] : null;

        return {
            id:               item.sys.id,
            slug:             f.slug || item.sys.id,
            titelDE:          f.titelDE || '',
            titelCZ:          f.titelCZ || '',
            datum:            f.datum || '',
            kategorie:        f.kategorie || '',
            zusammenfassungDE: f.zusammenfassungDE || '',
            zusammenfassungCZ: f.zusammenfassungCZ || '',
            inhaltDE:         f.inhaltDE || null,
            inhaltCZ:         f.inhaltCZ || null,
            titelbild:        bild ? `https:${bild.file.url}` : null,
            titelbildAlt:     bild ? (bild.description || bild.title || '') : '',
        };
    });
}

/** Rendert eine Blog-Karte */
function renderArtikelKarte(artikel, lang) {
    const titel        = lang === 'cs' ? artikel.titelCZ   : artikel.titelDE;
    const zusammenfassung = lang === 'cs' ? artikel.zusammenfassungCZ : artikel.zusammenfassungDE;
    const datum        = formatDatum(artikel.datum, lang);
    const blogUrl      = `blog.html?artikel=${encodeURIComponent(artikel.slug)}`;

    const bildHtml = artikel.titelbild
        ? `<div class="blog-karte__bild-wrapper">
               <img class="blog-karte__bild" src="${artikel.titelbild}?w=600&h=340&fit=fill&fm=webp"
                    alt="${artikel.titelbildAlt}" loading="lazy" width="600" height="340">
           </div>`
        : `<div class="blog-karte__bild-wrapper blog-karte__bild-wrapper--placeholder">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
               </svg>
           </div>`;

    return `
        <article class="blog-karte">
            ${bildHtml}
            <div class="blog-karte__body">
                ${artikel.kategorie ? `<span class="blog-karte__kategorie">${artikel.kategorie}</span>` : ''}
                <h3 class="blog-karte__titel">
                    <a href="${blogUrl}">${titel}</a>
                </h3>
                <p class="blog-karte__datum">${datum}</p>
                ${zusammenfassung ? `<p class="blog-karte__text">${zusammenfassung}</p>` : ''}
                <a href="${blogUrl}" class="blog-karte__link">
                    ${lang === 'cs' ? 'Číst dál' : 'Weiterlesen'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                </a>
            </div>
        </article>
    `;
}

/** Initialisiert Blog-Vorschau auf der Startseite (max. 3 Artikel) */
async function initBlogVorschau() {
    const container = document.getElementById('blog-vorschau');
    if (!container) return;

    const lang = getCurrentLanguage();

    container.innerHTML = `<div class="blog-loading">
        <div class="blog-loading__spinner"></div>
    </div>`;

    try {
        const artikel = await loadBlogArtikel({ limit: 3 });

        if (artikel.length === 0) {
            // Sektion komplett verstecken wenn keine Artikel
            const sektion = container.closest('.blog-vorschau-section');
            if (sektion) sektion.style.display = 'none';
            return;
        }

        container.innerHTML = artikel.map(a => renderArtikelKarte(a, lang)).join('');

    } catch (e) {
        console.warn('Blog-Vorschau konnte nicht geladen werden:', e.message);
        const sektion = container.closest('.blog-vorschau-section');
        if (sektion) sektion.style.display = 'none';
    }
}

/** Initialisiert die vollständige Blog-Übersichtsseite */
async function initBlogUebersicht() {
    const container = document.getElementById('blog-liste');
    if (!container) return;

    const lang = getCurrentLanguage();

    container.innerHTML = `<div class="blog-loading">
        <div class="blog-loading__spinner"></div>
    </div>`;

    try {
        const artikel = await loadBlogArtikel({ limit: 100 });

        if (artikel.length === 0) {
            container.innerHTML = `
                <p class="blog-leer">
                    ${lang === 'cs'
                        ? 'Zatím nejsou k dispozici žádné články.'
                        : 'Noch keine Artikel vorhanden.'}
                </p>`;
            return;
        }

        container.innerHTML = `<div class="blog-grid">
            ${artikel.map(a => renderArtikelKarte(a, lang)).join('')}
        </div>`;

    } catch (e) {
        container.innerHTML = `<p class="blog-fehler">
            ${lang === 'cs'
                ? 'Chyba při načítání článků.'
                : 'Artikel konnten nicht geladen werden.'}
        </p>`;
        console.error('Blog Fehler:', e);
    }
}

/** Zeigt einen einzelnen Artikel (für blog.html?artikel=slug) */
async function initEinzelArtikel() {
    const container = document.getElementById('artikel-inhalt');
    if (!container) return;

    const lang  = getCurrentLanguage();
    const slug  = new URLSearchParams(window.location.search).get('artikel');

    if (!slug) {
        window.location.href = 'blog.html';
        return;
    }

    container.innerHTML = `<div class="blog-loading">
        <div class="blog-loading__spinner"></div>
    </div>`;

    try {
        const data = await contentfulFetch(
            `/entries?content_type=blogArtikel&fields.slug=${encodeURIComponent(slug)}&limit=1&`
        );

        if (!data.items || data.items.length === 0) {
            window.location.href = 'blog.html';
            return;
        }

        const assetMap = {};
        if (data.includes && data.includes.Asset) {
            data.includes.Asset.forEach(a => { assetMap[a.sys.id] = a.fields; });
        }

        const f = data.items[0].fields;
        const titel        = lang === 'cs' ? f.titelCZ   : f.titelDE;
        const inhaltRaw    = lang === 'cs' ? f.inhaltCZ  : f.inhaltDE;
        const zusammenfassung = lang === 'cs' ? f.zusammenfassungCZ : f.zusammenfassungDE;
        const datum        = formatDatum(f.datum, lang);
        const inhaltHtml   = richTextToHtml(inhaltRaw);

        const bildId = f.titelbild?.sys?.id;
        const bild   = bildId ? assetMap[bildId] : null;
        const bildHtml = bild
            ? `<img class="artikel-hero-bild" src="https:${bild.file.url}?w=1200&h=500&fit=fill&fm=webp"
                    alt="${bild.description || bild.title || ''}" loading="eager" width="1200" height="500">`
            : '';

        // Seitentitel setzen
        document.title = `${titel} | Kanzlei Rosenkranz-Tittl`;

        const zurueckText = lang === 'cs' ? '← Zpět na blog' : '← Zurück zum Blog';
        const zurueckUrl  = 'blog.html';

        container.innerHTML = `
            <div class="artikel-wrapper">
                <a href="${zurueckUrl}" class="artikel-zurueck">${zurueckText}</a>
                ${bildHtml}
                <header class="artikel-header">
                    ${f.kategorie ? `<span class="blog-karte__kategorie">${f.kategorie}</span>` : ''}
                    <h1 class="artikel-titel">${titel}</h1>
                    <p class="artikel-datum">${datum}</p>
                    ${zusammenfassung ? `<p class="artikel-zusammenfassung">${zusammenfassung}</p>` : ''}
                </header>
                <div class="artikel-text">${inhaltHtml}</div>
            </div>
        `;

    } catch (e) {
        container.innerHTML = `<p class="blog-fehler">Artikel konnte nicht geladen werden.</p>`;
        console.error('Artikel Fehler:', e);
    }
}

// ─────────────────────────────────────────────
// Initialisierung beim Seitenload
// ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    loadUrlaubsBanner();
    initBlogVorschau();
    initBlogUebersicht();
    initEinzelArtikel();
});

// Public API für manuelle Aufrufe
window.RT = window.RT || {};
window.RT.contentful = { loadBlogArtikel, loadUrlaubsBanner };
