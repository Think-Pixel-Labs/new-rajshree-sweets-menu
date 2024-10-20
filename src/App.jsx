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
      const response = await axios.get('https://api.newrajshreesweets.com/common/products?status=ALL');
      const products = response.data;

      // Group products by category
      const groupedProducts = products.reduce((acc, product) => {
        const categoryName = product.ProductCategory.name;
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(product);
        return acc;
      }, {});

      setCategories(groupedProducts);
      setShowMenu(Object.fromEntries(Object.keys(groupedProducts).map(category => [category, false])));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  const toggleMenu = (category) => {
    setShowMenu({ ...showMenu, [category]: !showMenu[category] });
  }

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
          <div className={`text-white category-title-wrapper ${showMenu[category] ? 'active' : ''}`} onClick={() => toggleMenu(category)}>
            <h2 className='text-xl category-title'>{category}</h2>
            <FontAwesomeIcon icon={showMenu[category] ? faCaretDown : faCaretRight} className='caret' />
          </div>
          <div className={`items-container ${showMenu[category] ? 'grid' : 'hidden'}`}>
            {categories[category].map((item) => (
              <div key={item.id} className="item-wrapper">
                <img src={`https://api.newrajshreesweets.com/images/${item.id}/1.jpg`} alt={item.name} className="item-image" />
                <div className="item-details">
                  <h3 className='item-title'>{item.name}</h3>
                  <p className='item-unit'>{item.quantityType}</p>
                  <p className='item-rate'>
                    <FontAwesomeIcon icon={faIndianRupeeSign} /> {item.price}
                  </p>
                  {item.tag && <span className="item-tag">{item.tag}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
