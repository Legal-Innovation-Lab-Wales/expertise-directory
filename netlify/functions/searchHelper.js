const axios = require('axios');
const cheerio = require('cheerio');
const { 
    getSearchResultsFromDynamoDB,
    saveSearchResultsToDynamoDB
  } = require('./dynamoHelper');
const { removeDuplicates } = require('./utils');
const { fetchProfileData } = require('./profileHelper')

// Fetches results from a single page
const fetchPageResults = async function (url) {
    try {
      // console.log(`Fetching data from ${url}`);
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
  
      const resultPromises = $('ul.site-search-results-list li.site-search-results-list-item').map(async (index, element) => {
        const name = $(element).find('h3 a').text().trim();
        const profileUrl = $(element).find('h3 a').attr('href');
        const additionalInfo = $(element).find('.site-search-results-list-item-additional-information').text().trim();
  
        if (profileUrl.endsWith('-staff/')) {
          return null;
        }
  
        const profileData = await fetchProfileData(profileUrl);
        return { name, profileUrl, additionalInfo, ...profileData };
      }).get();
  
      const results = await Promise.all(resultPromises);
      return results.filter(result => result !== null);
    } catch (error) {
      // console.error(`Failed to fetch data from ${url}`, error);
      return [];
    }
  };

  
  
  fetchAllResults = async function (baseUrl, searchTerm) {
    console.time('Total fetchAllResults execution time');
    console.log(`Starting fetchAllResults for searchTerm: ${searchTerm}`);
  
    const searchKey = `SEARCH#${searchTerm}`;
    const cachedResults = await getSearchResultsFromDynamoDB(searchKey);
    if (cachedResults) {
      // console.log(`Search results for term "${searchTerm}" loaded from DynamoDB.`);
      // console.timeEnd('Total fetchAllResults execution time');
      return { results: cachedResults };
    }
  
    try {
      const firstPageData = await axios.get(`${baseUrl}&s=1`);
      const $ = cheerio.load(firstPageData.data);
      const totalResultsText = $('a.site-search-facets-facet-selected-category-link').text();
      const totalResultsMatch = totalResultsText.match(/\((\d+)\)/);
  
      const paginationText = $('.sr-only').text();  // "Page 1 of 33"
      const totalPagesMatch = paginationText.match(/Page \d+ of (\d+)/);
  
      let totalPages = 0;
  
      if (totalPagesMatch && totalPagesMatch[1]) {
        totalPages = parseInt(totalPagesMatch[1], 10);
      }
  
      // console.log(`Total number of pages: ${totalPages}`);
  
      if (!totalResultsMatch) {
        return { error: 'Could not determine the total number of results.', statusCode: 500 };
      }
      const totalResults = parseInt(totalResultsMatch[1], 10);
      // console.log("totalresults:", totalResults);
      if (totalPages > 25) {
        // console.log("advising too many results");
        return { error: `Too many results: ${totalResults}. Please refine your search criteria.`, statusCode: 400 };
      }
  
      let allResults = [];

      // Fetch from all pages and append results
      const fetchPagePromises = [];
  
      for (let page = 1; page <= totalPages; page++) {
        const pageUrl = `${baseUrl}&s=${1 + (page - 1) * 10}`;
        fetchPagePromises.push(fetchPageResults(pageUrl, searchTerm));
      }
  
      const pageResults = await Promise.all(fetchPagePromises);
  
      // Concatenate all page results into a single array
      allResults = pageResults.reduce((accumulator, current) => accumulator.concat(current), []);
  
      await saveSearchResultsToDynamoDB(searchKey, allResults);
      // console.log("Saved new search results to DynamoDB.");
  
      // console.timeEnd('Total fetchAllResults execution time');
      return { results: allResults }; // Return new results
    } catch (error) {
      // console.error("Error in fetchAllResults:", error.message);
      return { error: error.message, statusCode: 500 }; // Return error message and status code
    }
  };
  

module.exports = {
  fetchPageResults,
  fetchAllResults
};
