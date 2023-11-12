const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

// Initialize the reCAPTCHA client
const recaptchaClient = new RecaptchaEnterpriseServiceClient();

const projectID = 'process.env.PROJECT';
const recaptchaSiteKey = 'process.env.CAPTCHA';


// Helper function to get full photo URL
function getFullPhotoUrl(relativeUrl) {
    if (relativeUrl && !relativeUrl.startsWith('http')) {
      return `https://www.swansea.ac.uk${relativeUrl}`;
    }
    return relativeUrl;
  }
// Utility function to remove duplicates based on a property
function removeDuplicates(array, key) {
    let lookup = new Set();
    return array.filter(item => !lookup.has(item[key]) && lookup.add(item[key]));
  }

  function allowListInput(input) {
    // Define a pattern that matches allowed characters.
    // This pattern allows alphanumeric characters, spaces, hyphens, apostrophes, and full stops.
    const allowListPattern = /^[\w ']+$/;
  
    // Trim the input to remove leading/trailing whitespace
    const trimmedInput = input.trim();
  
    // Check if the input contains only allowed characters
    if (allowListPattern.test(trimmedInput)) {
      // The input is valid and contains only allowed characters
      return trimmedInput;
    } else {
      // The input contains disallowed characters, handle accordingly
      // For example, you could replace disallowed characters with an empty string
      return trimmedInput.replace(/[^\w ']/g, '');
    }
  }
  
  async function validateRecaptcha(token, action) {
    try {
      const projectPath = recaptchaClient.projectPath(projectID);
      const assessment = {
        event: {
          token: token,
          siteKey: recaptchaSiteKey,
        },
      };
      const request = {
        parent: projectPath,
        assessment: assessment,
      };
  
      const [response] = await recaptchaClient.createAssessment(request);
  
      // Check if the response is not empty and has the expected properties
      if (!response || !response.tokenProperties || !response.riskAnalysis) {
        console.error('Invalid response structure from reCAPTCHA API:', response);
        return { valid: false, reason: 'Invalid response structure from reCAPTCHA API' };
      }
  
      if (!response.tokenProperties.valid) {
        console.log(`Invalid reCAPTCHA token: ${response.tokenProperties.invalidReason}`);
        return { valid: false, reason: response.tokenProperties.invalidReason };
      }
  
      if (!response.tokenProperties.valid) {
        console.log(`Valid reCAPTCHA token`);
      }
  
      if (response.tokenProperties.action !== action) {
        console.log(`reCAPTCHA action mismatch: expected ${action}, got ${response.tokenProperties.action}`);
        return { valid: false, reason: 'Action mismatch' };
      }
  
      return { valid: response.riskAnalysis.score >= 0.5 };
    } catch (error) {
      console.error('Error in reCAPTCHA validation:', error);
      // Here you should also log the error stack for more detailed information
      console.error(error.stack);
      return { valid: false, reason: 'Validation error' };
    }
  }
  
  module.exports = {
    getFullPhotoUrl,
    removeDuplicates,
    allowListInput,
    validateRecaptcha
  };
  
