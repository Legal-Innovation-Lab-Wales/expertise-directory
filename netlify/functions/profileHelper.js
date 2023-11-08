const axios = require('axios');
const cheerio = require('cheerio');
const { getFullPhotoUrl } = require('./utils');
const { getProfileDataFromDynamoDB, saveProfileDataToDynamoDB } = require('./dynamoHelper');

// Helper function to fetch profile data
async function fetchProfileData(profileUrl) {
  const profileKey = `PROFILE#${profileUrl}`;
  console.log(`Checking for existing profile data for ${profileUrl}`);

  // Check if the profile data is cached
  const cachedProfileData = await getProfileDataFromDynamoDB(profileKey);
  if (cachedProfileData) {
    console.log(`Profile data for ${profileUrl} loaded from DynamoDB.`);
    return cachedProfileData;
  }

  console.log(`No existing data found. Fetching profile data for ${profileUrl}`);

  try {
    console.log(`Fetching profile data for ${profileUrl}`);
    const { data: profileData } = await axios.get(profileUrl);
    const profile$ = cheerio.load(profileData);

    // Extract the necessary data using cheerio
    const expertise = profile$('.staff-profile-areas-of-expertise ul li').map((i, el) => profile$(el).text()).get();
    const photoUrl = getFullPhotoUrl(profile$('.staff-profile-overview-profile-picture img').attr('src'));
    const photoAlt = profile$('.staff-profile-overview-profile-picture img').attr('alt');

    // Construct the data object to be saved to DynamoDB
    const dataToSave = {
      expertise: expertise,
      photoUrl: photoUrl,
      photoAlt: photoAlt,
    };

    // Save the new profile data to DynamoDB
    await saveProfileDataToDynamoDB(`PROFILE#${profileUrl}`, dataToSave);

    console.log(`Saved profile data for ${profileUrl} to DynamoDB.`);
    return dataToSave;
  } catch (error) {
    console.error(`Failed to fetch details for ${profileUrl}`, error);
    return { expertise: [], photoUrl: '', photoAlt: '' };
  }
}

module.exports = {
  fetchProfileData,
};
