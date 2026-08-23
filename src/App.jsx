import React, { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAward,
  faCaretDown,
  faEnvelope,
  faExternalLinkAlt,
  faGlobe,
  faLocationDot,
  faMagnifyingGlass,
  faPhone,
  faShieldHeart,
  faStar,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import logo from './assets/logo.png';
import {
  SHOP_URL,
  buildMenuImageCandidates,
  fetchAllMenuProducts,
  getFallbackMenu,
  normalizeApiProducts,
  sortCategories
} from './utils/menuCatalog';

const IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fff7ed" />
        <stop offset="52%" stop-color="#ffe8c7" />
        <stop offset="100%" stop-color="#f9d38d" />
      </linearGradient>
      <pattern id="motif" width="48" height="48" patternUnits="userSpaceOnUse">
        <circle cx="24" cy="24" r="2.5" fill="#b91c1c" opacity="0.16" />
      </pattern>
    </defs>
    <rect width="480" height="360" fill="url(#bg)" />
    <rect width="480" height="360" fill="url(#motif)" />
    <circle cx="240" cy="150" r="62" fill="#fffaf0" opacity="0.84" />
    <path d="M190 193c32-34 68-34 100 0" fill="none" stroke="#b91c1c" stroke-width="10" stroke-linecap="round" />
    <text x="240" y="258" font-family="Georgia, serif" font-size="24" fill="#7f1d1d" text-anchor="middle" font-weight="700">New Rajshree Sweets</text>
  </svg>
`)}`;

function MenuItemImage({ productName, variantId, alt }) {
  const candidates = useMemo(
    () => buildMenuImageCandidates(productName, variantId),
    [productName, variantId]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [productName, variantId]);

  const handleImageError = (event) => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((current) => current + 1);
      return;
    }

    event.currentTarget.onerror = null;
    event.currentTarget.src = IMAGE_PLACEHOLDER;
  };

  return (
    <img
      src={candidates[candidateIndex] || IMAGE_PLACEHOLDER}
      alt={alt}
      className="item-image"
      onError={handleImageError}
      loading="lazy"
    />
  );
}

function App() {
  const [categories, setCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sourceLabel, setSourceLabel] = useState('Live menu');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);

    try {
      const products = await fetchAllMenuProducts();
      const sortedCategories = sortCategories(normalizeApiProducts(products));

      setCategories(sortedCategories);
      setActiveCategory(Object.keys(sortedCategories)[0] || '');
      setSourceLabel('Live menu');
    } catch (error) {
      const fallbackCategories = getFallbackMenu();

      setCategories(fallbackCategories);
      setActiveCategory(Object.keys(fallbackCategories)[0] || '');
      setSourceLabel('Offline menu');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return categories;

    return Object.entries(categories).reduce((acc, [category, items]) => {
      const categoryMatches = category.toLowerCase().includes(search);
      const matchingItems = categoryMatches
        ? items
        : items.filter((item) => (
          item.name.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search) ||
          item.ingredients.some((ingredient) => ingredient.toLowerCase().includes(search))
        ));

      if (matchingItems.length) acc[category] = matchingItems;
      return acc;
    }, {});
  }, [categories, query]);

  const visibleCategoryNames = Object.keys(filteredCategories);
  const totalItems = Object.values(categories).reduce((total, items) => total + items.length, 0);
  const visibleItems = Object.values(filteredCategories).reduce((total, items) => total + items.length, 0);

  const toggleCategory = (category) => {
    setActiveCategory((current) => (current === category ? '' : category));
  };

  if (loading) {
    return (
      <main className="loading-shell" aria-live="polite">
        <img src={logo} alt="New Rajshree Sweets logo" className="loading-logo" />
        <p>Preparing the menu...</p>
      </main>
    );
  }

  return (
    <main className="menu-page">
      <section className="brand-hero">
        <div className="hero-content">
          <div className="brand-mark-wrap">
            <img src={logo} alt="New Rajshree Sweets logo" className="brand-logo" />
          </div>

          <div className="hero-copy">
            <p className="eyebrow">Varanasi's mithai house</p>
            <h1>New Rajshree Sweets</h1>
            <p className="hero-description">
              A curated menu of traditional sweets, namkeen and festive favourites, presented with the warmth of the Rajshree identity.
            </p>
            <a className="shop-now-link" href={SHOP_URL} target="_blank" rel="noopener noreferrer">
              Shop now
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
          </div>

          <div className="hero-badges" aria-label="Business highlights">
            <span><FontAwesomeIcon icon={faAward} /> FSSAI certified</span>
            <span><FontAwesomeIcon icon={faShieldHeart} /> Fresh batches</span>
            <span><FontAwesomeIcon icon={faStar} /> {totalItems} items</span>
          </div>
        </div>

        <div className="contact-panel" aria-label="Contact details">
          <a href="https://maps.google.com/?q=S%206%2F109-110%20Orderly%20Bazar%20Road%20Golghar%20Kachahari%20Varanasi%20221002" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faLocationDot} />
            <span>S 6/109-110 Orderly Bazar Road, Golghar Kachahari, Varanasi - 221002</span>
          </a>
          <a href="tel:+919792677770">
            <FontAwesomeIcon icon={faPhone} />
            <span>+91-9792677770</span>
          </a>
          <a href="mailto:newrajshreesweetspvtltd@gmail.com">
            <FontAwesomeIcon icon={faEnvelope} />
            <span>newrajshreesweetspvtltd@gmail.com</span>
          </a>
          <a href="https://newrajshreesweets.com" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faGlobe} />
            <span>newrajshreesweets.com</span>
          </a>
        </div>
      </section>

      <section className="menu-controls" aria-label="Menu controls">
        <div className="search-card">
          <div>
            <p className="section-kicker">{sourceLabel}</p>
            <h2>Explore the menu</h2>
          </div>

          <label className="search-box">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <span className="sr-only">Search sweets and categories</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sweets, namkeen, chhena..."
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </label>
        </div>

      </section>

      <section className="menu-list" aria-label="Menu categories">
        <div className="result-summary">
          <span>{visibleItems} items showing</span>
        </div>

        {visibleCategoryNames.length === 0 ? (
          <div className="empty-state">
            <h2>No matching sweets found</h2>
            <p>Try another search term or clear the search to browse the full menu.</p>
          </div>
        ) : (
          visibleCategoryNames.map((category) => {
            const isOpen = activeCategory === category || Boolean(query.trim());

            return (
              <article key={category} className="category-section">
                <button
                  type="button"
                  className={`category-title-wrapper ${isOpen ? 'active' : ''}`}
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isOpen}
                  aria-controls={`category-${category.replace(/\W+/g, '-').toLowerCase()}`}
                >
                  <span>
                    <small>{filteredCategories[category].length} items</small>
                    <strong>{category}</strong>
                  </span>
                  <FontAwesomeIcon icon={faCaretDown} className="caret" />
                </button>

                {isOpen && (
                  <div className="items-container" id={`category-${category.replace(/\W+/g, '-').toLowerCase()}`}>
                    {filteredCategories[category].map((item) => (
                      <div key={item.id} className="item-wrapper">
                        <div className="item-image-wrap">
                          <MenuItemImage
                            productName={item.imageName}
                            variantId={item.variantId}
                            alt={item.name}
                          />
                        </div>
                          <div className="item-details">
                            <h3>{item.name}</h3>
                          {item.description && <p className="item-description">{item.description}</p>}
                          <div className="item-meta">
                            {item.shelfLife ? <span>Shelf life: {item.shelfLife} days</span> : <span>Freshly prepared</span>}
                            <span>{item.quantityType}</span>
                          </div>
                          <p className="item-rate">
                            {item.priceLabel}
                          </p>
                          <a className="item-shop-link" href={item.shopHref || SHOP_URL} target="_blank" rel="noopener noreferrer">
                            Shop now
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      <footer className="site-footer">
        <p><span>CIN</span> U15490UP2021PTC156096</p>
        <p><span>GSTIN</span> 09AAHCN9500A1ZP</p>
        <p><span>FSSAI</span> 12714038000517</p>
      </footer>
    </main>
  );
}

export default App;
