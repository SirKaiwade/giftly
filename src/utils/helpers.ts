export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const calculateProgress = (current: number, goal: number): number => {
  if (goal === 0) return 0;
  return Math.min((current / goal) * 100, 100);
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateQRCodeURL = (url: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const getThemeClasses = (theme: string) => {
  const themes: Record<string, { bg: string; card: string; text: string; accent: string; button: string }> = {
    minimal: {
      bg: 'bg-white',
      card: 'bg-white border-gray-200',
      text: 'text-gray-900',
      accent: 'text-gray-700',
      button: 'bg-gray-900 hover:bg-gray-800 text-white',
    },
    pastel: {
      bg: 'bg-rose-50',
      card: 'bg-white border-rose-200',
      text: 'text-rose-900',
      accent: 'text-rose-700',
      button: 'bg-rose-700 hover:bg-rose-800 text-white',
    },
    dark: {
      bg: 'bg-gray-900',
      card: 'bg-gray-800 border-gray-700',
      text: 'text-white',
      accent: 'text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    floral: {
      bg: 'bg-purple-50',
      card: 'bg-white border-purple-200',
      text: 'text-purple-900',
      accent: 'text-purple-700',
      button: 'bg-purple-700 hover:bg-purple-800 text-white',
    },
    gold: {
      bg: 'bg-amber-50',
      card: 'bg-white border-amber-200',
      text: 'text-amber-900',
      accent: 'text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  };

  return themes[theme] || themes.minimal;
};

export type OpenGraphData = {
  title?: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
};

export const fetchOpenGraphData = async (url: string): Promise<OpenGraphData> => {
  const urlObj = new URL(url);
  const isAmazon = urlObj.hostname.includes('amazon.com') || urlObj.hostname.includes('amazon.co.uk') || urlObj.hostname.includes('amazon.ca');
  
  // Try multiple free proxy services as fallbacks
  const proxyServices = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  let html = '';
  const errors: string[] = [];

  // Try all proxy services in parallel - first one to succeed wins
  const proxyNames = ['allorigins.win', 'corsproxy.io', 'codetabs.com'];
  const proxyPromises = proxyServices.map((proxyUrl, i) => {
    const proxyName = proxyNames[i];
    
    return (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log(`[OpenGraph] Timeout after 5s for ${proxyName}`);
        controller.abort();
      }, 5000); // Reduced to 5 second timeout for faster failure
      
      try {
        console.log(`[OpenGraph] Trying proxy ${i + 1}/${proxyServices.length}: ${proxyName}`);
        const fetchStartTime = Date.now();
        const response = await fetch(proxyUrl, {
          signal: controller.signal,
        });
        const fetchDuration = Date.now() - fetchStartTime;
        
        clearTimeout(timeoutId);
        console.log(`[OpenGraph] ${proxyName} responded in ${fetchDuration}ms with status ${response.status}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check content type to determine if it's JSON or HTML
        const contentType = response.headers.get('content-type') || '';
        console.log(`[OpenGraph] ${proxyName} content-type: ${contentType}`);
        
        const readStartTime = Date.now();
        let responseHtml = '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          const readDuration = Date.now() - readStartTime;
          console.log(`[OpenGraph] ${proxyName} parsed JSON in ${readDuration}ms, keys:`, Object.keys(data));
          
          // Handle different JSON response formats
          if (data.contents) {
            responseHtml = data.contents;
          } else if (typeof data === 'string') {
            responseHtml = data;
          } else {
            throw new Error('Unexpected JSON response format');
          }
        } else {
          // Assume HTML/text response (e.g., corsproxy.io returns HTML directly)
          responseHtml = await response.text();
          const readDuration = Date.now() - readStartTime;
          console.log(`[OpenGraph] ${proxyName} read HTML in ${readDuration}ms, length: ${responseHtml.length}`);
        }

        if (!responseHtml || responseHtml.length < 100) {
          throw new Error('Response too short or empty');
        }

        // Success!
        console.log(`[OpenGraph] Successfully fetched with ${proxyName}`);
        return { html: responseHtml, proxyName };
      } catch (error: any) {
        clearTimeout(timeoutId);
        const errorMsg = error.name === 'AbortError' 
          ? `Timeout after 5s`
          : error.message || 'Unknown error';
        console.error(`[OpenGraph] ${proxyName} failed:`, errorMsg);
        throw { proxyName, error: errorMsg };
      }
    })();
  });

  // Race all proxies - first successful one wins
  try {
    const results = await Promise.allSettled(proxyPromises);
    
    // Find first successful result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        html = result.value.html;
        console.log(`[OpenGraph] Using result from ${result.value.proxyName}`);
        break;
      } else if (result.status === 'rejected') {
        const rejection = result.reason as { proxyName: string; error: string };
        errors.push(`${rejection.proxyName}: ${rejection.error}`);
      }
    }
  } catch (error) {
    console.error('[OpenGraph] Unexpected error in parallel fetch:', error);
  }

  if (!html) {
    const errorDetails = errors.length > 0 ? ` Errors: ${errors.join('; ')}` : '';
    console.error('[OpenGraph] All proxies failed:', errors);
    throw new Error(
      isAmazon 
        ? `Unable to fetch Amazon product data. Amazon blocks automated requests.${errorDetails} Please enter the product details manually.`
        : `Unable to fetch product data. The site may block automated requests.${errorDetails} Please enter the details manually.`
    );
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const ogData: OpenGraphData = {};

    if (isAmazon) {
      // Amazon-specific parsing (they don't use OpenGraph)
      const titleEl = doc.querySelector('#productTitle') || 
                     doc.querySelector('h1.a-size-large') ||
                     doc.querySelector('h1[data-automation-id="title"]');
      const title = titleEl?.textContent?.trim() || '';

      // Amazon price extraction
      let price: number | undefined;
      const priceWhole = doc.querySelector('.a-price-whole')?.textContent?.replace(/[^0-9.]/g, '');
      const priceFraction = doc.querySelector('.a-price-fraction')?.textContent?.replace(/[^0-9]/g, '');
      if (priceWhole) {
        price = parseFloat(priceWhole + (priceFraction ? '.' + priceFraction : ''));
      } else {
        // Try alternative price selectors
        const priceText = doc.querySelector('.a-price .a-offscreen')?.textContent || 
                         doc.querySelector('[data-a-color="price"] .a-offscreen')?.textContent ||
                         doc.querySelector('#priceblock_ourprice')?.textContent ||
                         doc.querySelector('#priceblock_dealprice')?.textContent ||
                         doc.querySelector('.a-price-range')?.textContent;
        if (priceText) {
          const priceMatch = priceText.match(/[\d,]+\.?\d*/);
          if (priceMatch) {
            price = parseFloat(priceMatch[0].replace(/,/g, ''));
          }
        }
      }

      // Amazon image extraction
      const imageEl = doc.querySelector('#landingImage') || 
                     doc.querySelector('#imgBlkFront') ||
                     doc.querySelector('#main-image') ||
                     doc.querySelector('img[data-a-image-name="landingImage"]');
      const image = imageEl?.getAttribute('src') || 
                   imageEl?.getAttribute('data-src') ||
                   imageEl?.getAttribute('data-old-src') ||
                   '';

      // Amazon description
      const descriptionEl = doc.querySelector('#feature-bullets') ||
                           doc.querySelector('#productDescription') ||
                           doc.querySelector('#aplus_feature_div');
      let description = '';
      if (descriptionEl) {
        const bullets = descriptionEl.querySelectorAll('li span, p');
        description = Array.from(bullets)
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 10)
          .slice(0, 3)
          .join(' ');
      }

      ogData.title = title;
      ogData.description = description;
      ogData.image = image;
      if (price !== undefined && !isNaN(price)) {
        ogData.price = price;
        ogData.currency = 'USD';
      }
    } else {
      // Standard OpenGraph extraction for other sites
      const ogTitle = doc.querySelector('meta[property="og:title"]');
      const ogDescription = doc.querySelector('meta[property="og:description"]');
      const ogImage = doc.querySelector('meta[property="og:image"]');
      const ogPrice = doc.querySelector('meta[property="og:price:amount"]');
      const ogCurrency = doc.querySelector('meta[property="og:price:currency"]');

      // Fallback to standard meta tags if OG tags don't exist
      const title = ogTitle?.getAttribute('content') || 
                   doc.querySelector('meta[name="title"]')?.getAttribute('content') ||
                   doc.querySelector('title')?.textContent ||
                   '';
      
      const description = ogDescription?.getAttribute('content') ||
                        doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                        '';
      
      const image = ogImage?.getAttribute('content') ||
                   doc.querySelector('meta[name="image"]')?.getAttribute('content') ||
                   '';

      // Extract price
      const priceStr = ogPrice?.getAttribute('content');
      const price = priceStr ? parseFloat(priceStr) : undefined;
      const currency = ogCurrency?.getAttribute('content') || 'USD';

      // Convert relative image URLs to absolute
      let absoluteImage = image;
      if (image && !image.startsWith('http')) {
        try {
          const baseUrlObj = new URL(url);
          if (image.startsWith('//')) {
            absoluteImage = `${baseUrlObj.protocol}${image}`;
          } else if (image.startsWith('/')) {
            absoluteImage = `${baseUrlObj.protocol}//${baseUrlObj.host}${image}`;
          } else {
            absoluteImage = `${baseUrlObj.protocol}//${baseUrlObj.host}/${image}`;
          }
        } catch (e) {
          // If URL parsing fails, keep original
        }
      }

      ogData.title = title.trim();
      ogData.description = description.trim();
      ogData.image = absoluteImage;
      if (price !== undefined && !isNaN(price)) {
        ogData.price = price;
        ogData.currency = currency;
      }
    }

    return ogData;
  } catch (error: any) {
    console.error('Error parsing OpenGraph data:', error);
    throw new Error('Failed to parse product information. Please enter the details manually.');
  }
};
