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

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const start = parseInt(event.queryStringParameters.s) || 1;
  const resultsPerPage = 10; 

  const url = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page type]=staff profile&start=${start}`;
  const { results, totalPages } = await fetchPage(url);

  // Fetch additional data from profile pages (optional)
  const detailedResults = await Promise.all(results.map(async (result) => {
    let expertise = [];
    let photoUrl = '';
    let photoAlt = '';

    try {
      const { data: profileData } = await axios.get(result.profileUrl);
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
      console.error(`Failed to fetch details for ${result.profileUrl}`);
    }

    return { ...result, expertise, photoUrl, photoAlt };
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ results: detailedResults, totalPages })
  };
};
