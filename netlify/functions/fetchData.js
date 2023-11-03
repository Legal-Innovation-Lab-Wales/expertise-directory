const axios = require('axios');
const cheerio = require('cheerio');

console.log('entering fetch');

async function fetchPageResults(url) {
  console.log(`Fetching data from URL: ${url}`);
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  // ... rest of the code unchanged
}

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const start = parseInt(event.queryStringParameters.s, 10) || 1; // Changed default value to 1
  const baseUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page type]=staff profile`;

  try {
    const pageUrl = `${baseUrl}&s=${(start - 1) * 10}`; // Adjust s parameter calculation
    console.log(`Fetching data from URL: ${pageUrl}`);
    const { data: pageData } = await axios.get(pageUrl);
    const $ = cheerio.load(pageData);

    let totalPages = 1;
    $('ul.site-search-results-pagination li.site-search-results-pagination-item').each((i, el) => {
      const pageNum = parseInt($(el).find('a.site-search-results-pagination-item-link').text(), 10);
      totalPages = Math.max(totalPages, pageNum || 1);
    });

    console.log('Total pages:', totalPages);

    const results = await fetchPageResults(pageUrl);

    console.log('Total records:', results.length);
    return {
      statusCode: 200,
      body: JSON.stringify({ results: results, totalPages: totalPages }),
    };
  } catch (error) {
    console.error('Error fetching page results:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' }),
    };
  }
};
