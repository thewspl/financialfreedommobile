const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');

async function testSabahRssFeed() {
  try {
    console.log('Fetching Sabah finance RSS feed...');
    const response = await axios.get('https://www.sabah.com.tr/rss/finansborsa-haberleri.xml');
    console.log('Response received, parsing XML...');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "_",
      isArray: (name) => name === 'item',
    });

    const result = parser.parse(response.data);

    const channel = result.rss.channel;
    console.log('Feed title:', channel.title);

    if (channel.item && channel.item.length > 0) {
      console.log('Total items:', channel.item.length);
      console.log('First item title:', channel.item[0].title);
      console.log('First item description (extract):', channel.item[0].description.substring(0, 100) + '...');

      // Extract image URL from description
      const imgMatch = channel.item[0].description.match(/src="([^"]+)"/);
      console.log('Image URL:', imgMatch ? imgMatch[1] : 'No image found');
    } else {
      console.log('No items found in the feed');
    }

    console.log('Test successful!');
  } catch (error) {
    console.error('Error testing Sabah RSS feed:', error);
  }
}

testSabahRssFeed(); 