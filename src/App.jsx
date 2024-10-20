import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown, faCaretRight, faIndianRupeeSign } from '@fortawesome/free-solid-svg-icons';
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
      const response = await axios.get('http://localhost:3000/common/products?status=ALL');
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
            <stop offset="0%" style="stop-color:#f3d9ff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d9e3ff;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#grad)"/>
        <text x="100" y="90" font-family="Arial, sans-serif" font-size="18" fill="#2d3436" text-anchor="middle" font-weight="bold">Image not found</text>
        <text x="100" y="130" font-family="Arial, sans-serif" font-size="24" fill="#6c5ce7" text-anchor="middle">(•︵•)</text>
      </svg>
    `;
    e.target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgPlaceholder)}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="menu-container">
      <div className="misc-details">
        <img src={require('./assets/logo.png')} alt='logo' className='logo' />
        <h1 className='text-3xl font-bold menu-title mb-3'>NEW RAJSHREE SWEETS PRIVATE LIMITED</h1>
        <p className='text-xl font-bold'>S 6/109-110 ORDERLY BAZAR ROAD</p>
        <p className='text-xl font-bold'>GOLGHAR KACHAHARI</p>
        <p className='text-xl font-bold mb-5'>VARANASI - 221002</p>
        <p className='text-l'><span className='font-bold'>CIN :</span> U15490UP2021PTC156096</p>
        <p className='text-l'><span className='font-bold'>GSTIN :</span> 09AAHCN9500A1ZP</p>
        <p className='text-l'><span className='font-bold'>FSSAI LIC NO :</span> 12714038000517</p>
        <p className='text-l'><span className='font-bold'>Phone :</span> 0542-2504477</p>
        <p className='text-l'><span className='font-bold'>Email :</span> newrajshreesweetspvtltd@gmail.com</p>
      </div>
      {Object.keys(categories).map((category) => (
        <div key={category} className="category-container">
          <div className={`category-title-wrapper ${showMenu[category] ? 'active' : ''}`} onClick={() => toggleMenu(category)}>
            <h2 className='category-title'>{category}</h2>
            <FontAwesomeIcon icon={showMenu[category] ? faCaretDown : faCaretRight} className='caret' />
          </div>
          {showMenu[category] && (
            <div className="items-container grid">
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
                    <p className='shelf-life'>Shelf Life: {item.shelfLife} Days</p>
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
