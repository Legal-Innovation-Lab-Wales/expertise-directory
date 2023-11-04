const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Create a cache instance with a TTL (time to live) of 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const s = event.queryStringParameters.s || 1;  // set default value of s to 1 if not provided
  const baseUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page%20type]=staff%20profile`;

  try {
    const url = `${baseUrl}&s=${s}`;
    const cachedData = cache.get(url);
    if (cachedData) {
      console.log('Data found in cache.');
      return {
        statusCode: 200,
        body: JSON.stringify(cachedData)
      };
    }

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

    cache.set(url, results);

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    console.error(`Failed to fetch data from ${url}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' }),
    };
  }
};
