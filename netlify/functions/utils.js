const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

if (!process.env.GOOGLE_CREDENTIALS || !process.env.PROJECT_ID || !process.env.CAPTCHA) {
    throw error; // Re-throw the error to be handled by the calling function
    // Handle missing variables appropriately
  }
  

// Decode the base64 service account key
const serviceAccountKey = JSON.parse(Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8'));


// Initialize the reCAPTCHA client with the decoded credentials
const recaptchaClient = new RecaptchaEnterpriseServiceClient({
    credentials: {
      client_email: serviceAccountKey.client_email,
      private_key: serviceAccountKey.private_key,
    },
  });

const projectID = process.env.PROJECT_ID;
const recaptchaSiteKey = process.env.CAPTCHA;


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
    const allowListPattern = /^[\w '"]+$/;
  
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
  
      if (!response || !response.tokenProperties || !response.riskAnalysis) {
        throw new Error('Invalid response structure from reCAPTCHA API');
      }
  
      if (!response.tokenProperties.valid) {
        throw new Error(`Invalid reCAPTCHA token: ${response.tokenProperties.invalidReason}`);
      }
  
      if (response.tokenProperties.action !== action) {
        throw new Error(`reCAPTCHA action mismatch: expected ${action}, got ${response.tokenProperties.action}`);
      }
  
      // Assuming a score of 0.5 or more is a pass
      if (response.riskAnalysis.score < 0.5) {
        throw new Error('reCAPTCHA score below the threshold');
      }
  
      // If all checks pass, return true to indicate a successful validation
      return true;
    } catch (error) {
      console.error('Error in reCAPTCHA validation:', error);
      console.error(error.stack);
      throw error; // Re-throw the error to be handled by the calling function
    }
  }
  
  module.exports = {
    getFullPhotoUrl,
    removeDuplicates,
    allowListInput,
    validateRecaptcha
  };
  