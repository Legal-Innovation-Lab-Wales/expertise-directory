const AWS = require('aws-sdk');

AWS.config.update({
  region: 'eu-west-2', // Your DynamoDB region
  accessKeyId: process.env.DYNO_ACCESS,
  secretAccessKey: process.env.DYNO_SECRET,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Function to save search results to DynamoDB
const saveSearchResultsToDynamoDB = async (searchTerm, results) => {
    const params = {
      TableName: 'searches',
      Item: {
        'term': `${searchTerm}`,
        'results': results,
        'entrydate': Date.now(),
        'TTL': Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      },
      ConditionExpression: "attribute_not_exists(term)" // This ensures the item is only written if the search term does not exist
    };
  
    try {
        await dynamoDb.put(params).promise();
        // console.log(`Saved search results for term "${searchTerm}" to DynamoDB.`);
        return { saved: true };
      } catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
          // console.log(`Search results for term "${searchTerm}" already exist in DynamoDB.`);
        } else {
          // console.error('Error saving search results to DynamoDB:', error);
        }
        return { saved: false };
      }
  };
  
  // Function to save individual profile data to DynamoDB
  const saveProfileDataToDynamoDB = async (profileUrl, profileData) => {
    const params = {
      TableName: 'profiles',
      Item: {
        'profile': profileUrl,
        'data': profileData,
        'entrydate': Date.now(),
        'TTL': Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
      },
      ConditionExpression: "attribute_not_exists(profile)" // This line ensures the item is only written if the profile does not exist
    };
  
    try {
      await dynamoDb.put(params).promise();
      // console.log(`Saved profile data for URL "${profileUrl}" to DynamoDB.`);
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        // console.log(`Profile data for URL "${profileUrl}" already exists in DynamoDB.`);
      } else {
        // console.error('Error saving profile data to DynamoDB:', error);
      }
    }
  };
  
  const getProfileDataFromDynamoDB = async (profileKey) => {
    const params = {
      TableName: 'profiles',
      Key: {
        profile: profileKey
      }
    };
  
    try {
      const data = await dynamoDb.get(params).promise();
      return data.Item ? data.Item.data : null;
    } catch (error) {
      // console.error('Error getting profile data from DynamoDB:', error);
      return null;
    }
  };
  
  const getSearchResultsFromDynamoDB = async (searchTerm) => {
    const params = {
      TableName: 'searches',
      Key: {
        term: `${searchTerm}`
      }
    };
  
    try {
      const data = await dynamoDb.get(params).promise();
      return data.Item ? data.Item.results : null;
    } catch (error) {
      // console.error('Error getting search results from DynamoDB:', error);
      return null;
    }
  };
  
// Function to append search results to DynamoDB
const appendSearchResultsToDynamoDB = async (searchTerm, newResults) => {
    // Retrieve any existing results for the searchTerm
    const existingResults = await getSearchResultsFromDynamoDB(`SEARCH#${searchTerm}`);
    let allResults = [];
  
    // If there are existing results, merge them with the new results
    if (existingResults) {
      const existingUrls = new Set(existingResults.map(result => result.profileUrl));
      newResults.forEach(result => {
        if (!existingUrls.has(result.profileUrl)) {
          allResults.push(result);
        }
      });
      allResults = [...existingResults, ...allResults];
    } else {
      allResults = newResults;
    }
  
    // Save the combined results back to DynamoDB
    const params = {
      TableName: 'searches',
      Item: {
        'term': `SEARCH#${searchTerm}`,
        'results': allResults,
        'entrydate': Date.now(),
        'TTL': Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
      }
    };
  
    try {
      await dynamoDb.put(params).promise();
      // console.log(`Appended search results for term "${searchTerm}" to DynamoDB.`);
    } catch (error) {
      console.error('Error appending search results to DynamoDB:', error);
    }
  };

  module.exports = {
    getProfileDataFromDynamoDB,
    getSearchResultsFromDynamoDB,
    saveSearchResultsToDynamoDB,
    appendSearchResultsToDynamoDB,
    saveProfileDataToDynamoDB
  };
  