const axios = require('axios');
const cheerio = require('cheerio');
const { fetchAllResults } = require('./searchHelper');

exports.handler = async function (event) {
  try {
    // Check if the searchTerm is provided in the query string
    if (!event.queryStringParameters || !event.queryStringParameters.q) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No search term provided.' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }
  
    // If searchTerm is provided, process it
    const searchTerm = event.queryStringParameters.q.toLowerCase();
    const baseURL = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f%5Bpage+type%5D=staff+profile`;

    // Fetch the first page to get the number of results
    const firstPageUrl = `${baseURL}&s=1`;
    const { data: firstPageData } = await axios.get(firstPageUrl);
    const $ = cheerio.load(firstPageData);
    const paginationText = $('.sr-only').text();  // "Page 1 of 33"
    const totalPagesMatch = paginationText.match(/Page \d+ of (\d+)/);

    let totalPages = 0;

    if (totalPagesMatch && totalPagesMatch[1]) {
    totalPages = parseInt(totalPagesMatch[1], 10);
    }

    console.log(`Total number of pages: ${totalPages}`);
  
    if (totalPages > 25) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Too many results. Please refine your search criteria.' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // Fetching all results
    const fetchResults = await fetchAllResults(baseURL, searchTerm);

    // If there are results, return them with status code 200
    return {
      statusCode: 200,
      body: JSON.stringify(fetchResults),
      headers: {
        'Cache-Control': 'public, max-age=2592000',
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    // If there is an error, log the error and return a response with the error message and status code
    console.error(`Handler encountered an error: ${error.message}`);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message || 'An error occurred during the operation.' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};
