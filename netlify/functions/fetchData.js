const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function (event) {
  const searchTerm = event.queryStringParameters.q;
  const url = `https://www.swansea.ac.uk/search/?c=www-en-meta&q=${encodeURIComponent(searchTerm)}&f[page type]=staff profile`;

  try {
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

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed fetching data' })
    };
  }
};
