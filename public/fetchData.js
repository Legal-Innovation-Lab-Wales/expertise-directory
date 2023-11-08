// fetchData.js
const { fetchAllResults } = require('./searchHelper');

exports.handler = async function(event, context) {
  const searchTerm = event.queryStringParameters.q;
  // Use fetchAllResults from searchHelper to get the search results
  const results = await fetchAllResults(searchTerm);
  return {
    statusCode: 200,
    body: JSON.stringify({ results })
  };
};
