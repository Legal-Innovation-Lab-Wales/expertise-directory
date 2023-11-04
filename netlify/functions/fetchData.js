const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Create a cache instance with a TTL (time to live) of 30 days
const cache = new NodeCache({ stdTTL: 30 });

// Export the fetchPageResults function
exports.fetchPageResults = async function (url) {
  console.log(`Fetching data from URL: ${url}`);
  
  // Check if the data is already cached
  const cachedData = cache.get(url);
  if (cachedData) {
    console.log('Data found in cache.');
    return cachedData;
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const results = await Promise.all(
      $('ul.site-search-results-list li.site-search-results-list-item').map(async (index, element) => {
        const name = $(element).find('h3 a').text().trim();
        const profileUrl = $(element).find('h3 a').attr('href');
        const additionalInfo = $(element).find('.site-search-results-list-item-additional-information').text().trim();

        let expertise = [];
        let photoUrl = '';
        let photoAlt = '';

        try {
          console.log(`Fetching data for profile URL: ${profileUrl}`);
          const { data: profileData } = await axios.get(profileUrl);
          const profile$ = cheerio.load(profileData);

          profile$('.staff-profile-areas-of-expertise ul li').each((i, el) => {
            expertise.push(profile$(el).text());
          });

          photoUrl = profile$('.staff-profile-overview-profile-picture img').attr('src');
          photoAlt = profile$('.staff-profile-overview-profile-picture img').attr('alt');

          // Prepend the domain if the URL is a relative path
          if (photoUrl && !photoUrl.startsWith('http')) {
            photoUrl = `https://www.swansea.ac.uk${photoUrl}`;
          }
        } catch (error) {
          console.error(`Failed to fetch details for ${profileUrl}`, error);
        }

        return { name, profileUrl, additionalInfo, expertise, photoUrl, photoAlt };
      }).get()
    );

    // Cache the results with the URL as the cache key
    cache.set(url, results);

    return results;
  } catch (error) {
    console.error(`Failed to fetch data from ${url}`, error);
    return []; // Return an empty array to avoid undefined in Promise.all
  }
};

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const baseUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(
    searchTerm
  )}&f[page type]=staff profile`;
  console.log('Trying to find pagination');

  try {
    // Fetch the first page to get the total number of pages
    const firstPageUrl = `${baseUrl}&s=0`;
    console.log(`Fetching data from first page URL: ${firstPageUrl}`);
    
    // Check if the first page data is already cached
    const cachedFirstPageData = cache.get(firstPageUrl);
    if (!cachedFirstPageData) {
      const { data: firstPageData } = await axios.get(firstPageUrl);
      cache.set(firstPageUrl, firstPageData);
    }

    const $ = cheerio.load(cachedFirstPageData || '');

    // Extract total pages information from pagination
    let totalPages = 1;
    $('ul.site-search-results-pagination li.site-search-results-pagination-item').each((i, el) => {
      const pageNum = parseInt($(el).find('a.site-search-results-pagination-item-link').text(), 10);
      if (!isNaN(pageNum)) {
        totalPages = Math.max(totalPages, pageNum);
      }
      console.log(`Page ${i + 1}: ${pageNum}`);
    });

    console.log('Total pages:', totalPages);

    // Use Promise.all to fetch data for multiple pages concurrently
  const fetchPagePromises = Array.from({ length: totalPages }, (_, i) => {
    const s = 1 + i * 10;  // Update this line to increment s by 10 for each page
    const url = new URL(baseUrl);
    url.searchParams.set('s', s);
    return exports.fetchPageResults(url.toString());
  });




    const allResults = await Promise.all(fetchPagePromises);

    const flattenedResults = allResults.flat();

    console.log('Total records:', flattenedResults.length);

    return {
      statusCode: 200,
      body: JSON.stringify(flattenedResults),
    };
  } catch (error) {
    console.error('Error fetching page results:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' }),
    };
  }
};
