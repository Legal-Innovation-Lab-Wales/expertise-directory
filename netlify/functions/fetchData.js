const axios = require('axios');
const cheerio = require('cheerio');

async function fetchPageResults(url) {
  console.log(`Fetching data from URL: ${url}`);
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

        if (photoUrl && !photoUrl.startsWith('http')) {
          photoUrl = `https://www.swansea.ac.uk${photoUrl}`;
        }
      } catch (error) {
        console.error(`Failed to fetch details for ${profileUrl}`, error);
      }

      return { name, profileUrl, additionalInfo, expertise, photoUrl, photoAlt };
    }).get()
  );

  return results;
}

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const page = parseInt(event.queryStringParameters.p, 10) || 1; // Default to 1
  const start = (page - 1) * 10 + 1;
  const baseUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(
    searchTerm
  )}&f[page%20type]=staff%20profile`;

  try {
    const pageUrl = `${baseUrl}&s=${start}`;
    console.log(`Fetching data from URL: ${pageUrl}`);
    const { data: pageData } = await axios.get(pageUrl);
    const $ = cheerio.load(pageData);

    let totalPages = 1;
    $('ul.site-search-results-pagination li.site-search-results-pagination-item').each((i, el) => {
      const pageNum = parseInt($(el).find('a.site-search-results-pagination-item-link').text(), 10);
      totalPages = Math.max(totalPages, pageNum || 1);
    });

    console.log('Total pages:', totalPages);

    // Create an array of promises for fetching results concurrently
    const fetchResultsPromises = Array.from({ length: totalPages }, (_, i) => {
      const s = 1 + 10 * i;
      const pageUrl = `${baseUrl}&s=${s}`;
      return fetchPageResults(pageUrl);
    });

    const allResults = (await Promise.all(fetchResultsPromises)).flat();

    console.log('Total records:', allResults.length);
    return {
      statusCode: 200,
      body: JSON.stringify({ results: allResults, totalPages: totalPages }),
    };
  } catch (error) {
    console.error('Error fetching page results:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' }),
    };
  }
};
