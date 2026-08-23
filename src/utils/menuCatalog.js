import axios from 'axios';
import localMenu from '../data/menu.json';

export const API_HOSTS = [
  'https://api2.newrajshreesweets.com',
  'https://api3.newrajshreesweets.com',
  'https://api.newrajshreesweets.com'
];
export const ASSETS_URL = 'https://assets.newrajshreesweets.com';
export const SHOP_URL = 'https://www.newrajshreesweets.com/shop';
export const HAMPERS_URL = 'https://www.newrajshreesweets.com/hampers';

const PAGE_SIZE = 100;
const MENU_VISIBLE_STATUSES = new Set(['IN_STOCK', 'OUT_OF_STOCK']);

function isVisibleMenuProduct(product) {
  return MENU_VISIBLE_STATUSES.has(String(product?.status || '').toUpperCase());
}

function isVisibleMenuVariant(variant) {
  const status = String(variant?.status || '').toUpperCase();
  return status !== 'DISABLED';
}

export function compareNames(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'en', {
    sensitivity: 'base',
    numeric: true
  });
}

export function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function encodeAssetSegment(value) {
  return encodeURIComponent(String(value ?? '').trim());
}

export function buildMenuImageCandidates(productName, variantId = null) {
  if (!productName) return [];

  const base = `${ASSETS_URL}/product-images/${encodeAssetSegment(productName)}`;
  const candidates = [];

  if (variantId) {
    const variantBase = `${base}/${encodeAssetSegment(variantId)}`;
    candidates.push(`${variantBase}/thumb/1.webp`, `${variantBase}/1.webp`);
  }

  candidates.push(`${base}/thumb/1.webp`, `${base}/1.webp`);
  return candidates;
}

export function getProductVariants(product) {
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    return product.variants;
  }

  return product?.options?.hamper?.variants || [];
}

function variantDisplayName(productName, variant) {
  const ranceName = String(variant?.ranceLab?.productName || '').trim();
  if (ranceName) return ranceName;

  const label = String(variant?.label || variant?.name || '').trim();
  const parent = String(productName || '').trim();
  if (!label) return parent;
  if (parent.toLowerCase() === label.toLowerCase()) return parent;

  return `${parent} (${label})`;
}

function toMenuItem(product, { variant = null, price, priceLabel, categoryName } = {}) {
  const isHamper = Boolean(product.isHamper || product.options?.hamper || variant);

  return {
    id: variant
      ? `${product.id || product.name}-${variant.id}`
      : product.id || `${categoryName}-${product.name}`,
    name: variant ? variantDisplayName(product.name, variant) : product.name,
    price,
    priceLabel,
    quantityType: product.quantityType || 'unit',
    shelfLife: product.shelfLife,
    imageName: product.name,
    variantId: variant?.id || null,
    description: product.description || '',
    ingredients: product.options?.hamper?.ingredients || [],
    shopHref: isHamper ? HAMPERS_URL : SHOP_URL
  };
}

export function normalizeApiProducts(products = []) {
  return products.reduce((acc, product) => {
    if (!isVisibleMenuProduct(product)) return acc;

    const categoryName = product.isHamper
      ? 'Hampers'
      : product.ProductCategory?.name || 'Signature Sweets';
    if (!acc[categoryName]) acc[categoryName] = [];

    const hamperOptions = product.options?.hamper;
    const variants = getProductVariants(product).filter(isVisibleMenuVariant);

    if (variants.length > 0) {
      variants.forEach((variant, index) => {
        const variantPrice = Number(variant.price ?? product.price ?? 0);
        acc[categoryName].push(
          toMenuItem(product, {
            variant: { ...variant, id: variant.id || String(index) },
            price: variantPrice,
            priceLabel: formatPrice(variantPrice),
            categoryName
          })
        );
      });
      return acc;
    }

    const price = Number(product.price || 0);
    acc[categoryName].push(
      toMenuItem(product, {
        price,
        priceLabel: hamperOptions?.priceRangeLabel || formatPrice(price),
        categoryName
      })
    );

    return acc;
  }, {});
}

export function normalizeLocalMenu(menu) {
  return Object.entries(menu).reduce((acc, [categoryName, items]) => {
    acc[categoryName] = items.map((item, index) => ({
      id: `${categoryName}-${item.name}-${index}`,
      name: item.name,
      price: Number(item.rate || 0),
      priceLabel: formatPrice(item.rate),
      quantityType: categoryName.toLowerCase().includes('piece') ? 'piece' : 'kg',
      shelfLife: null,
      imageName: item.name,
      variantId: null,
      description: '',
      ingredients: [],
      shopHref: SHOP_URL
    }));

    return acc;
  }, {});
}

export function sortCategories(groupedProducts) {
  return Object.keys(groupedProducts)
    .sort(compareNames)
    .reduce((acc, category) => {
      acc[category] = [...groupedProducts[category]].sort((a, b) => compareNames(a.name, b.name));
      return acc;
    }, {});
}

function productsPath(host) {
  return `${host}/common/products`;
}

async function fetchJson(url, params) {
  const response = await axios.get(url, {
    params,
    timeout: 12000
  });
  return response.data;
}

async function fetchProductPage(host, offset, extraParams = {}) {
  const payload = await fetchJson(productsPath(host), {
    status: 'ALL',
    isMenuCall: true,
    limit: PAGE_SIZE,
    offset,
    ...extraParams
  });

  return Array.isArray(payload?.data) ? payload.data : [];
}

async function fetchPagedProducts(host, extraParams = {}) {
  let expected = null;

  try {
    const countResponse = await fetchJson(`${productsPath(host)}/count`, {
      status: 'ALL',
      isMenuCall: true,
      ...extraParams
    });
    const parsed = Number(countResponse?.data);
    if (Number.isFinite(parsed) && parsed >= 0) expected = parsed;
  } catch {
    expected = null;
  }

  const all = [];
  let offset = 0;

  for (;;) {
    const batch = await fetchProductPage(host, offset, extraParams);
    all.push(...batch);

    if (batch.length === 0) break;
    if (batch.length > PAGE_SIZE) break;
    if (Number.isFinite(expected) && all.length >= expected) break;
    if (batch.length < PAGE_SIZE) break;

    offset += batch.length;
    if (offset > 5000) break;
  }

  return all;
}

function mergeProductsById(productLists) {
  const byId = new Map();

  productLists.flat().forEach((product) => {
    const key = product?.id ?? `name:${product?.name}`;
    if (!byId.has(key)) byId.set(key, product);
  });

  return [...byId.values()];
}

export async function fetchAllMenuProducts() {
  let lastError = null;

  for (const host of API_HOSTS) {
    try {
      const [catalog, hampers] = await Promise.all([
        fetchPagedProducts(host),
        fetchPagedProducts(host, { isHamper: 1 })
      ]);
      const merged = mergeProductsById([catalog, hampers]);
      if (merged.length) return merged.filter(isVisibleMenuProduct);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to load the live menu');
}

export function getFallbackMenu() {
  return sortCategories(normalizeLocalMenu(localMenu));
}
