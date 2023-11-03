const axios = require('axios');
const cheerio = require('cheerio');

async function fetchPageResults(url) {
  console.log(`Fetching data from URL: ${url}`);
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = await Promise.all($('ul.site-search-results-list li.site-search-results-list-item').map(async (index, element) => {
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
  }).get());

  return results;
};

exports.handler = async function (event) {
  const { q } = event.queryStringParameters;
  const baseUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(q)}&f[page type]=staff profile`;
  console.log('Trying to find pagination');

  try {
    const firstPageUrl = `${baseUrl}&s=1`;
    console.log(`Fetching data from first page URL: ${firstPageUrl}`);
    const { data: firstPageData } = await axios.get(firstPageUrl);
    const $ = cheerio.load(firstPageData);

    let totalPages = 1;
    const pageCountText = $('span.sr-only').text();
    const matches = pageCountText.match(/Page (\d+) of (\d+)/);
    if (matches) {
      totalPages = parseInt(matches[2], 10);
    }

    console.log('Total pages:', totalPages);

    const allPagesPromises = Array.from({ length: totalPages }, (_, i) => {
      const s = 1 + 10 * (Math.pow(2, i) - 1);
      const url = new URL(baseUrl);
      url.searchParams.set('s', s);
      return fetchPageResults(url.toString());
    });

    const allResults = (await Promise.all(allPagesPromises)).flat();

    console.log('Total records:', allResults.length);

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
