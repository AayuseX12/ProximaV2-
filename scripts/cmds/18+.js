const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "18+",
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
      const responses = [
        {
          keywords: ["gula thankyo", "lado thankyo"],
          responseText: "Dewuu Ma Chusdenxu🥵😒"
        },
        {
          keywords: ["fusi jharyo", "fusi ayo", "sperm jharyo", "sperm ayo","maal jharyo","mal ayo","maal jharyo","maal ayo"],
          responseText: "Mero Mukh Ma jhardeu🥵😒"
        },
        {
          keywords: ["lado chusdeuna"],
          responseText: "Huss Dewwwu Ma Chusdenxu🥵😗"
        }
      ];

      for (const { keywords, responseText } of responses) {
        if (keywords.some(keyword => event.body.toLowerCase().includes(keyword))) {
          try {
            api.setMessageReaction("🥵", event.messageID, () => {}, true);
            return message.reply({
              body: responseText
            });
          } catch (error) {
            console.error("Error in onChat function:", error);
            return message.reply("Sorry, an error occurred while processing your request.");
          }
        }
      }
    }
  }
};