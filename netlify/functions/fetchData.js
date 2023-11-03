const axios = require('axios');
const cheerio = require('cheerio');

console.log('entering fetch');

// Export the fetchPageResults function
exports.fetchPageResults = async function (url) {
  console.log(`Fetching data from URL: ${url}`); // Log the URL being fetched
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
      console.log(`Fetching data for profile URL: ${profileUrl}`); // Log the profile URL being fetched
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
      console.error(`Failed to fetch details for ${profileUrl}`, error); // Log any errors
    }

    return { name, profileUrl, additionalInfo, expertise, photoUrl, photoAlt };
  }).get());

  return results;
};

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const baseUrl = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page type]=staff profile`;
  console.log('trying to find pagination');

  try {
    // Fetch the first page to get the total number of pages
    const firstPageUrl = `${baseUrl}&s=0`;
    console.log(`Fetching data from first page URL: ${firstPageUrl}`); // Log the first page URL being fetched
    const { data: firstPageData } = await axios.get(firstPageUrl);
    const $ = cheerio.load(firstPageData);

    // Extract total pages information from pagination
    let totalPages = 1;
    $('ul.site-search-results-pagination li.site-search-results-pagination-item').each((i, el) => {
      const pageNum = parseInt($(el).find('a.site-search-results-pagination-item-link').text(), 10);
      totalPages = Math.max(totalPages, pageNum || 1);
    });

    console.log('Total pages:', totalPages); // Debug statement

      // Inside the handler function
      const allPagesPromises = Array.from({ length: totalPages }, (_, i) => {
        const s = 1 + 10 * (Math.pow(2, i) - 1); // Calculate s as per your requirement
        
        // Construct a URL object to manipulate query parameters
        const url = new URL(baseUrl);
        
        // Set or overwrite the 's' query parameter
        url.searchParams.set('s', s);
        
        // Fetch results using the modified URL
        return fetchPageResults(url.toString());
      });

    const allResults = (await Promise.all(allPagesPromises)).flat();

    console.log('Total records:', allResults.length); // Debug statement

    return {
      statusCode: 200,
      body: JSON.stringify(allResults),
    };
  } catch (error) {
    console.error('Error fetching page results:', error); // Log any errors
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' }),
    };
  }
};
