const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Create a cache instance with a TTL (time to live) of 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const baseUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(
    searchTerm
  )}&f[page type]=staff profile`;

  try {
    // Fetch the first page to get the total number of pages
    const firstPageUrl = `${baseUrl}&s=0`;
    const { data: firstPageData } = await axios.get(firstPageUrl);
    const $ = cheerio.load(firstPageData);

    // Extract total pages information from pagination
    let totalPages = 1;
    $('ul.site-search-results-pagination li.site-search-results-pagination-item').each((i, el) => {
      const pageNum = parseInt($(el).find('a.site-search-results-pagination-item-link').text(), 10);
      if (!isNaN(pageNum)) {
        totalPages = Math.max(totalPages, pageNum);
      }
    });

    // Use Promise.all to fetch data for multiple pages concurrently
    const fetchPagePromises = Array.from({ length: totalPages }, (_, i) => {
      const s = 1 + 10 * (Math.pow(2, i) - 1);  // Adjust this formula if necessary
      const url = new URL(baseUrl);
      url.searchParams.set('s', s);
      return fetchPageResults(url.toString());  // Assume fetchPageResults is similar to your local version
    });

    const allResults = await Promise.all(fetchPagePromises);

    const flattenedResults = allResults.flat();

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
