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
  module.exports = {
    getFullPhotoUrl,
    removeDuplicates
  };
  
