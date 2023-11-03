const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const url = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page type]=staff profile`;

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Extract and format data from the HTML
    const results = $('ul.site-search-results-list li.site-search-results-list-item').map((index, element) => {
      const name = $(element).find('h3 a').text().trim();
      const profileUrl = $(element).find('h3 a').attr('href');
      const additionalInfo = $(element).find('.site-search-results-list-item-additional-information').text().trim();
      return { name, profileUrl, additionalInfo };
    }).get();

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' })
    };
  }
};
