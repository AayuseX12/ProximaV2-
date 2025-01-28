const { createReadStream, unlinkSync, createWriteStream, ensureDirSync } = require("fs-extra");
const { resolve } = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "say",
    aliases: ["bol"],
    version: "1.1",
    author: "Aayusha Shrestha",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "text to speech with language",
    },
    longDescription: {
      en: "Convert text into speech in various languages.",
    },
    category: "fun",
    guide: {
      en: "#say",
    },
  },

  onStart: async function ({ api, event, args }) {
    try {
      const content = event.type === "message_reply" ? event.messageReply.body : args.join(" ");
      const supportedLanguages = ["ru", "en", "ko", "ja", "tl", "vi", "in", "ne"];
      const defaultLanguage = "en";

      // Extract language code and text
      const [language, ...textParts] = content.split(" ");
      const languageToSay = supportedLanguages.includes(language) ? language : defaultLanguage;
      const msg = supportedLanguages.includes(language) ? textParts.join(" ") : content;

      if (!msg.trim()) {
        return api.sendMessage("Please provide text to convert into speech.", event.threadID);
      }

      // Ensure the cache directory exists
      const cacheDir = resolve(__dirname, "cache");
      ensureDirSync(cacheDir);

      const filePath = resolve(cacheDir, `${event.threadID}_${event.senderID}.mp3`);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=${languageToSay}&client=tw-ob`;

      // Fetch and save TTS audio with a User-Agent header
      const response = await axios({
        method: "GET",
        url,
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        },
      });

      const writer = response.data.pipe(createWriteStream(filePath));
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // Send the audio file
      api.sendMessage(
        { attachment: createReadStream(filePath) },
        event.threadID,
        () => unlinkSync(filePath)
      );
    } catch (error) {
      console.error("Error occurred during TTS:", error);
      api.sendMessage("An error occurred while processing your request. Please try again later.", event.threadID);
    }
  },
};