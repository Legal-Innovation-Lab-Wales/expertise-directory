const axios = require('axios');
const cheerio = require('cheerio');

async function fetchPage(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  // Extract results from the current page
  const results = $('ul.site-search-results-list li.site-search-results-list-item').map((index, element) => {
    const name = $(element).find('h3 a').text().trim();
    const profileUrl = $(element).find('h3 a').attr('href');
    const additionalInfo = $(element).find('.site-search-results-list-item-additional-information').text().trim();

    return { name, profileUrl, additionalInfo };
  }).get();

  // Extract the total number of pages from the pagination element
  const totalPages = $('ul.site-search-results-pagination li.site-search-results-pagination-item').last().prev().find('a').text();
  const totalPagesNum = parseInt(totalPages) || 1;
  
  return { results, totalPages: totalPagesNum };
}

async function fetchAllPages(searchTerm) {
  const start = 1;
  const url = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page type]=staff profile&start=${start}`;
  const { results, totalPages } = await fetchPage(url);
  const allResults = [...results];

  for(let i = 2; i <= totalPages; i++) {
    const nextPageUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page type]=staff profile&start=${i * 10}`;
    const { results: nextPageResults } = await fetchPage(nextPageUrl);
    allResults.push(...nextPageResults);
  }

  return allResults;
}

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const allResults = await fetchAllPages(searchTerm);

  // Fetch additional data from profile pages (optional)
  const detailedResults = await Promise.all(allResults.map(async (result) => {
    // ... (same as your existing code)
    return { ...result, expertise, photoUrl, photoAlt };
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ results: detailedResults, totalPages: Math.ceil(detailedResults.length / 10) })
  };
};
