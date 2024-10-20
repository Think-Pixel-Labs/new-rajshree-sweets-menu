import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight, faIndianRupeeSign, faGlobe, faPhone, faEnvelope, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

function App() {
  const [categories, setCategories] = useState({});
  const [showMenu, setShowMenu] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://api.newrajshreesweets.com/common/products?status=ALL');
      const products = response.data.data;

      // Group products by category and sort products within each category
      const groupedProducts = products.reduce((acc, product) => {
        const categoryName = product.ProductCategory.name;
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(product);
        return acc;
      }, {});

      // Sort products within each category
      Object.keys(groupedProducts).forEach(category => {
        groupedProducts[category].sort((a, b) => a.name.localeCompare(b.name));
      });

      // Sort categories alphabetically
      const sortedCategories = Object.keys(groupedProducts).sort().reduce((acc, key) => {
        acc[key] = groupedProducts[key];
        return acc;
      }, {});

      setCategories(sortedCategories);
      // Initialize all categories as collapsed
      setShowMenu(Object.fromEntries(Object.keys(sortedCategories).map(category => [category, false])));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const toggleMenu = (category) => {
    setShowMenu(prevState => ({
      ...Object.fromEntries(Object.keys(prevState).map(cat => [cat, false])),
      [category]: !prevState[category]
    }));
  }

  const handleImageError = (e) => {
    e.target.onerror = null;
    const svgPlaceholder = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffe4e6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fef3c7;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad)"/>
        <text x="100" y="90" font-family="Arial, sans-serif" font-size="18" fill="#e11d48" text-anchor="middle" font-weight="bold">Image not found</text>
        <text x="100" y="130" font-family="Arial, sans-serif" font-size="24" fill="#e11d48" text-anchor="middle">•︵•</text>
      </svg>
    `;
    e.target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgPlaceholder)}`;
  };

  if (loading) {
    return <div className="loading">Loading delicious treats...</div>;
  }

  return (
    <div className="menu-container">
      <div className="misc-details">
        <img src={require('./assets/logo.png')} alt='logo' className='logo' />
        <h1 className='text-3xl md:text-4xl font-bold menu-title'>NEW RAJSHREE SWEETS</h1>
        <div className="contact-info">
          <div className="contact-item">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
            <p>S 6/109-110 Orderly Bazar Road, Golghar Kachahari, Varanasi - 221002</p>
          </div>
          <div className="contact-item">
            <FontAwesomeIcon icon={faPhone} className="contact-icon" />
            <a href="tel:+919792677770">+91-9792677770</a>
          </div>
          <div className="contact-item">
            <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
            <a href="mailto:newrajshreesweetspvtltd@gmail.com">newrajshreesweetspvtltd@gmail.com</a>
          </div>
          <div className="contact-item">
            <FontAwesomeIcon icon={faGlobe} className="contact-icon" />
            <a href="https://newrajshreesweets.com" target="_blank" rel="noopener noreferrer">newrajshreesweets.com</a>
          </div>
        </div>
        <div className="company-info">
          <p><span>CIN:</span> U15490UP2021PTC156096</p>
          <p><span>GSTIN:</span> 09AAHCN9500A1ZP</p>
          <p><span>FSSAI:</span> 12714038000517</p>
        </div>
      </div>
      {Object.keys(categories).map((category) => (
        <div key={category} className="category-container">
          <div className={`category-title-wrapper ${showMenu[category] ? 'active' : ''}`} onClick={() => toggleMenu(category)}>
            <h2 className='category-title'>{category}</h2>
            <FontAwesomeIcon icon={showMenu[category] ? faCaretDown : faCaretRight} className='caret' />
          </div>
          {showMenu[category] && (
            <div className="items-container">
              {categories[category].map((item) => (
                <div key={item.id} className="item-wrapper">
                  <img
                    src={`https://assets.newrajshreesweets.com/product-images/${encodeURIComponent(item.name)}/1.webp`}
                    alt={item.name}
                    className="item-image"
                    onError={handleImageError}
                  />
                  <div className="item-details">
                    <h3 className='item-title'>{item.name}</h3>
                    <p className='shelf-life'><strong>Shelf Life</strong>: {item.shelfLife} Days</p>
                    <p className='item-rate'>
                      <FontAwesomeIcon icon={faIndianRupeeSign} /> {item.price.toLocaleString('en-IN')} / {item.quantityType}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;
