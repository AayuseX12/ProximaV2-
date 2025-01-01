const fs = require('fs');
const path = require('path');
const axios = require('axios');
const tmp = require('tmp'); // For temporary file storage

module.exports = {
  config: {
    name: "putii",
    version: "1.0",
    author: "aayusee",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function() {
    // Initialization code if needed
  },

  onChat: async function({ event, message, getLang, api }) {
    if (event.body) {
      // Define different keyword sets and their corresponding responses and attachment URLs
      const responses = [
        {
          keywords: ["proxima timro puti", "proxima timro pussy", "proxima puti dekhauna"],
          responseText: "Lau Mero Putie🥵",
          attachmentURL: 'https://i.postimg.cc/FRmg8Phr/545975-small.jpg'  // Postimg URL
        },
        {
          keywords: ["fya parana", "fya parana puti", "fyaa parana puti", "fya banauna pussy"],
          responseText: "Huss fyaa banako 🥵🤧",
          attachmentURL: 'https://i.postimg.cc/Xvrg9ZQW/1000000025.web'  // Postimg URL
        },
        {
          keywords: ["aajhei fya parana", "ajhei fya banauna"],
          responseText: "Huss🥵 Polyo Pussy💦",
          attachmentURL: 'https://i.postimg.cc/8PykxsBx/IMG-20241119-152521.jpg'  // Postimg URL
        }
      ];

      // Iterate through each response set and check if any keywords match
      for (const { keywords, responseText, attachmentURL } of responses) {
        if (keywords.some(keyword => event.body.toLowerCase().includes(keyword))) {
          try {
            // Set reaction to the message
            api.setMessageReaction("🥵", event.messageID, () => {}, true);

            // Download the image from the URL
            const response = await axios({
              method: 'get',
              url: attachmentURL,
              responseType: 'stream'
            });

            // Create a temporary file to store the image
            const tempFile = tmp.fileSync({ postfix: '.jpg' });

            // Pipe the downloaded image to the temporary file
            response.data.pipe(fs.createWriteStream(tempFile.name));

            // Wait for the image to be fully written
            response.data.on('end', () => {
              // Send the response with the downloaded image
              message.reply({
                body: responseText,
                attachment: fs.createReadStream(tempFile.name)  // Send the image file
              });
            });

          } catch (error) {
            console.error("Error in onChat function:", error);
            return message.reply("Sorry, an error occurred while processing your request.");
          }
        }
      }
    }
  }
}