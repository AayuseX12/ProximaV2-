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
          attachmentPath: path.resolve(__dirname, '545975.small.jpg')
        },
        {
          keywords: ["fya parana", "fya parana puti", "fyaa parana puti", "fya banauna pussy"],
          responseText: "Huss fyaa banako 🥵🤧",
          attachmentPath: path.resolve(__dirname, '1000000025.jpg')
        },
        {
          keywords: ["aajhei fya parana", "ajhei fya banauna"],
          responseText: "Huss🥵 Polyo Pussy💦",
          attachmentPath: path.resolve(__dirname, 'IMG_20241119_152521.jpg')
        }
      ];

      // Iterate through each response set and check if any keywords match
      for (const { keywords, responseText, attachmentPath } of responses) {
        if (keywords.some(keyword => event.body.toLowerCase().includes(keyword))) {
          try {
            // Set reaction to the message
            api.setMessageReaction("🥵", event.messageID, () => {}, true);

            // Check if the specified file exists
            if (!fs.existsSync(attachmentPath)) {
              console.error("File does not exist at:", attachmentPath);
              return message.reply("File not found.");
            }

            // Confirm file readability
            const fileStream = fs.createReadStream(attachmentPath);
            fileStream.on('error', (error) => {
              console.error("Error reading the file stream:", error);
              return message.reply("Error reading file.");
            });

            // Send reply with specific response and attachment
            return message.reply({
              body: responseText,
              attachment: fileStream
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