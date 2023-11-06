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
    // console.log(`Invalid profile URL pattern: ${profileUrl}`);
    return { expertise, photoUrl, photoAlt };  // Return empty data for invalid URL pattern
  }

  // console.log(`Fetching data for profile URL: ${profileUrl}`);

  const cachedProfileData = staffProfileCache.get(profileUrl);
  if (cachedProfileData) {
    // console.log(`Profile data for ${profileUrl} found in cache.`);
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
    // console.log('Data found in cache.');
    return cachedData;
  }
  
  // console.log(`Fetching data from URL: ${url}`);

 try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const resultPromises = $('ul.site-search-results-list li.site-search-results-list-item').map(async (index, element) => {
      const name = $(element).find('h3 a').text().trim();
      const profileUrl = $(element).find('h3 a').attr('href');
      const additionalInfo = $(element).find('.site-search-results-list-item-additional-information').text().trim();

      if (profileUrl.endsWith('-staff/')) {
        // console.log(`Invalid profile URL pattern: ${profileUrl}`);
        return null;
      }

      

      return fetchProfileData(profileUrl)
        .then(({ expertise, photoUrl, photoAlt }) => ({ name, profileUrl, additionalInfo, expertise, photoUrl, photoAlt }));
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
// ...

// Handler function to fetch all results based on search term
exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const baseURL = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f%5Bpage+type%5D=staff+profile`;

  try {
    // Fetch the first page to determine the total number of pages
    const firstPageUrl = `${baseURL}&s=1`;
    const { data: firstPageData } = await axios.get(firstPageUrl);

    // Extract total number of pages from pagination div
    const $ = cheerio.load(firstPageData);
    const totalPages = parseInt($('ul.site-search-results-pagination li.site-search-results-pagination-item')
      .last().prev().text().trim(), 10);

    // Calculate theoretical maximum number of results
    const theoreticalMaxResults = totalPages * 10;
    const resultExceedsThreshold = theoreticalMaxResults > 99;

    if (resultExceedsThreshold) {
      // Send an error response indicating that there are too many results
      return {
        statusCode: 400, // You can choose an appropriate status code
        body: JSON.stringify({ error: 'Too many results. Please refine your search criteria.' }),
      };
    }

    // Proceed with fetching results if the threshold is not exceeded
    const allResults = await exports.fetchAllResults(baseURL);
    // console.log('Total records:', allResults.length);

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
  console.time('Total fetchAllResults execution time'); // Start timer

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
    const resultExceedsThreshold = theoreticalMaxResults > 99;

    // console.log('Total pages:', totalPages);
    // console.log('Theoretical maximum results:', theoreticalMaxResults);

    if (resultExceedsThreshold) {
      // console.log('Theoretical maximum results exceed the threshold. Stopping further fetching.');
      return { totalResults, resultExceedsThreshold };
    }

    // Proceed with fetching data if the threshold is not exceeded
    const urls = Array.from({ length: totalPages }, (_, i) => `${baseUrl}&s=${1 + i * 10}`);

    // Function to fetch data in batches
    const fetchInBatches = async (urls, batchSize) => {
      const batches = Array(Math.ceil(urls.length / batchSize)).fill().map((_, i) => {
        return urls.slice(i * batchSize, (i * batchSize) + batchSize);
      });

      for (const batch of batches) {
        const batchResultsPromises = batch.map(url => exports.fetchPageResults(url));
        const batchResults = await Promise.all(batchResultsPromises);
        totalResults.push(...batchResults.flat());
      }
    };

    await fetchInBatches(urls, 10); // Fetch in batches of 10

    // console.log('Final Results returned:', totalResults.length);
    console.timeEnd('Total fetchAllResults execution time'); // End timer

    return { totalResults, resultExceedsThreshold };
  } catch (error) {
    console.error("Error fetching all results:", error);
    throw error;
  }
};





