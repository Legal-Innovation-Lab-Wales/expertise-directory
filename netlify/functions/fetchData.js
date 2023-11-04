const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Create a cache instance with a TTL (time to live) of 3600 seconds (1 hour)
const cache = new NodeCache({ stdTTL: 3660 });

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

    cache.set(url, results);

    return results;
  } catch (error) {
    console.error(`Failed to fetch data from ${url}`, error);
    return [];
  }
};

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const baseURL = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f%5Bpage+type%5D=staff+profile`;
  console.log('Total records check');
  try {
    // Call fetchAllResults to get all results across pages
    const allResults = await exports.fetchAllResults(baseURL);
    console.log('Total records:', allResults.length);  // Debug statement to log total records

    return {
      statusCode: 200,
      body: JSON.stringify(allResults),
    };

  } catch (error) {
    console.error('Error fetching page results:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' }),
    };
  }
};

exports.fetchAllResults = async function (baseUrl) {
  try {
    // Fetch the first page to get the total number of pages
    const firstPageUrl = `${baseUrl}&s=1`;
    const { data: firstPageData } = await axios.get(firstPageUrl);
    const $ = cheerio.load(firstPageData);

    // Extract total pages information from pagination
    let totalPages = 1;
    const pageCountText = $('span.sr-only').text();
    const matches = pageCountText.match(/Page (\d+) of (\d+)/);
    if (matches) {
      totalPages = parseInt(matches[2], 10);
    }

    console.log('Total num of pages:', totalPages);  // Debug statement

    // Fetch all pages
    const allPagesPromises = Array.from({ length: totalPages }, (_, i) => {
      const s = 1 + 10 * i;  // Adjusted the calculation here to match standard pagination
      const urlWithPage = `${baseUrl}&s=${s}`;
      
      // Fetch results using the modified URL
      return exports.fetchPageResults(urlWithPage);
    });

    const allResults = (await Promise.all(allPagesPromises)).flat();

    return allResults;
  } catch (error) {
    console.error("Error fetching all results:", error);
    throw error;  // Re-throw the error so it can be caught and handled by the calling function
  }
};
