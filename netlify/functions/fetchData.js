const axios = require('axios');
const cheerio = require('cheerio');
const NodeCache = require('node-cache');

// Create caches with TTL values
const staffProfileCache = new NodeCache({ stdTTL: 15552000 });
const urlCache = new NodeCache({ stdTTL: 2592000 });

// Helper function to fetch profile data
async function fetchProfileData(profileUrl) {
  let expertise = [];
  let photoUrl = '';
  let photoAlt = '';

  // Verify the URL pattern before proceeding
  if (profileUrl.match(/-staff\/$/)) {
    return { expertise, photoUrl, photoAlt };  // Return empty data for invalid URL pattern
  }

  const cachedProfileData = staffProfileCache.get(profileUrl);
  if (cachedProfileData) {
    return cachedProfileData;
  }

  try {
    const { data: profileData } = await axios.get(profileUrl);
    const profile$ = cheerio.load(profileData);

    profile$('.staff-profile-areas-of-expertise ul li').each((i, el) => {
      expertise.push(profile$(el).text());
    });

    photoUrl = profile$('.staff-profile-overview-profile-picture img').attr('src');
    photoAlt = profile$('.staff-profile-overview-profile-picture img').attr('alt');

    photoUrl = getFullPhotoUrl(photoUrl);

    // Cache the profile data with a TTL of 6 months
    const profileInfo = { expertise, photoUrl, photoAlt };
    staffProfileCache.set(profileUrl, profileInfo);
    return profileInfo;
  } catch (error) {
    console.error(`Failed to fetch details for ${profileUrl}`, error);
    return { expertise, photoUrl, photoAlt };  // Empty data on error
  }
}





// Helper function to get full photo URL
function getFullPhotoUrl(relativeUrl) {
  if (relativeUrl && !relativeUrl.startsWith('http')) {
    return `https://www.swansea.ac.uk${relativeUrl}`;
  }
  return relativeUrl;
}

// Fetches results from a single page
exports.fetchPageResults = async function (url) {
  

  const cachedData = urlCache.get(url);
  if (cachedData) {
    return cachedData;
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const resultPromises = $('ul.site-search-results-list li.site-search-results-list-item').map(async (index, element) => {
      const name = $(element).find('h3 a').text().trim();
      const profileUrl = $(element).find('h3 a').attr('href');
      const additionalInfo = $(element).find('.site-search-results-list-item-additional-information').text().trim();

      // Verify the URL pattern before proceeding
      const urlPattern = /-staff\/$/;
      if (urlPattern.test(profileUrl)) {
        return null;  // Return null for invalid URL pattern
      }

      const { expertise, photoUrl, photoAlt } = await fetchProfileData(profileUrl);
      return { name, profileUrl, additionalInfo, expertise, photoUrl, photoAlt };
    }).get();

    const results = await Promise.all(resultPromises);

    const validResults = results.filter(result => result !== null);  // Filter out null values

    // Cache the results with the URL as the key
    urlCache.set(url, validResults);
    return validResults;

  } catch (error) {
    console.error(`Failed to fetch data from ${url}`, error);
    return [];
  }
};


// Handler function to fetch all results based on search term
exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const baseURL = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f%5Bpage+type%5D=staff+profile`;

  try {
    const allResults = await exports.fetchAllResults(baseURL);

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

// Fetches all results across multiple pages
exports.fetchAllResults = async function (baseUrl) {
  try {
    let totalResults = [];

    // Fetch the first page to determine the total number of pages
    const firstPageUrl = `${baseUrl}&s=1`;
    const { data: firstPageData } = await axios.get(firstPageUrl);

    // Extract total number of pages from pagination div
    const $ = cheerio.load(firstPageData);
    const totalPages = parseInt($('ul.site-search-results-pagination li.site-search-results-pagination-item')
      .last().prev().text().trim(), 10);

    // Calculate theoretical maximum number of results
    const theoreticalMaxResults = totalPages * 10;

    // Fetch data from all pages
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
      const s = 1 + 10 * (currentPage - 1);
      const urlWithPage = `${baseUrl}&s=${s}`;

      const pageResults = await exports.fetchPageResults(urlWithPage);
      totalResults = [...totalResults, ...pageResults];


    }

    // Check if theoretical max is 100 and actual results are less than 100, then fetch additional data
    if (theoreticalMaxResults === 100 && totalResults.length < 100) {
      const s = 101;
      const urlWithAdditionalPage = `${baseUrl}&s=${s}`;
      const additionalPageResults = await exports.fetchPageResults(urlWithAdditionalPage);
      totalResults = [...totalResults, ...additionalPageResults];
    }

    return totalResults;
  } catch (error) {
    console.error("Error fetching all results:", error);
    throw error;
  }
};

