const axios = require('axios');
const cheerio = require('cheerio');

async function fetchPageResults(url) {
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
      console.error(`Failed to fetch details for ${profileUrl}`);
    }

    return { name, profileUrl, additionalInfo, expertise, photoUrl, photoAlt };
  }).get());

  return results;
}

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const baseUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page type]=staff profile`;

  try {
    // Fetch the first page to get the total number of pages
    const firstPageUrl = `${baseUrl}&s=0`;
    const { data: firstPageData } = await axios.get(firstPageUrl);
    const $ = cheerio.load(firstPageData);
    
    // Extract total pages information from pagination
    let totalPages = 1;
    $('ul.site-search-results-pagination li.site-search-results-pagination-item').each((i, el) => {
      const pageNum = parseInt($(el).find('a.site-search-results-pagination-item-link').text(), 10);
      totalPages = Math.max(totalPages, pageNum || 1);
    });

    // Fetch all pages
    const allPagesPromises = Array.from({ length: totalPages }, (_, i) => {
      const pageUrl = `${baseUrl}&s=${i * 10}`;
      return fetchPageResults(pageUrl);
    });

    const allResults = (await Promise.all(allPagesPromises)).flat();

    return {
      statusCode: 200,
      body: JSON.stringify(allResults)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' })
    };
  }
};
