const fs = require('fs');
const path = require('path');

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
      // Define different keyword sets and their corresponding responses and attachments
      const responses = [
        {
          keywords: ["proxima timro puti", "proxima timro pussy", "proxima puti dekhauna"],
          responseText: "Lau Mero Putie🥵",
          attachmentURL: 'https://i.postimg.cc/FRmg8Phr/545975-small.jpg'  // Updated Postimg URL
        },
        {
          keywords: ["fya parana", "fya parana puti", "fyaa parana puti", "fya banauna pussy"],
          responseText: "Huss fyaa banako 🥵🤧",
          attachmentURL: 'https://i.postimg.cc/Xvrg9ZQW/1000000025.web'  // Updated Postimg URL
        },
        {
          keywords: ["aajhei fya parana", "ajhei fya banauna"],
          responseText: "Huss🥵 Polyo Pussy💦",
          attachmentURL: 'https://i.postimg.cc/8PykxsBx/IMG-20241119-152521.jpg'  // Provided Postimg URL
        }
      ];

      // Iterate through each response set and check if any keywords match
      for (const { keywords, responseText, attachmentURL } of responses) {
        if (keywords.some(keyword => event.body.toLowerCase().includes(keyword))) {
          try {
            // Set reaction to the message
            api.setMessageReaction("🥵", event.messageID, () => {}, true);

            // Send reply with specific response and attachment
            return message.reply({
              body: responseText,
              attachment: attachmentURL  // Direct URL to image hosted on Postimg
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