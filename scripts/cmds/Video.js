const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports = {
  config: {
    name: "video2",
    version: "1.0.0",
    author: "aayuse",
    countDown: 5,
    role: 2,
    shortDescription: {
      en: "Download YouTube videos (under 25MB) or provide a link",
    },
    longDescription: {
      en: "Search and download YouTube videos under 25MB, or provide a direct download link if the file size is too large.",
    },
    category: "owner",
    guide: {
      en: "{pn} <video name>",
    },
  },

  onStart: async function ({ args, message }) {
    if (!args[0]) {
      return message.reply("❌ | Jis song ki video dekhni ho uska name likho..!");
    }

    try {
      const query = args.join(" ");
      await message.reply(`🔍 | "${query}" song dhondh kar send karti hun...`);

      const searchResults = await yts(query);
      const firstResult = searchResults.videos[0];

      if (!firstResult) {
        return message.reply(`❌ | "${query}" ke liye koi results nahi mile.`);
      }

      const { title, url } = firstResult;
      await message.reply(`⏳ | "${title}" ka download link mil raha hai...`);

      const apiUrl = `https://mr-prince-malhotra-ytdl.vercel.app/video?url=${encodeURIComponent(url)}`;
      const response = await axios.get(apiUrl);
      const responseData = response.data;

      if (!responseData.result || !responseData.result.url) {
        return message.reply(`❌ | "${title}" ke liye download link nahi mila.`);
      }

      const downloadUrl = responseData.result.url;
      const filePath = path.resolve(__dirname, "cache", `${Date.now()}-${title}.mp4`);

      const videoResponse = await axios({
        method: "get",
        url: downloadUrl,
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const fileStream = fs.createWriteStream(filePath);
      videoResponse.data.pipe(fileStream);

      fileStream.on("finish", async () => {
        const fileSizeInMB = fs.statSync(filePath).size / (1024 * 1024);

        if (fileSizeInMB > 25) {
          fs.unlinkSync(filePath);
          return message.reply(`❌ | "${title}" ka size ${fileSizeInMB.toFixed(2)}MB hai, jo 25MB se zyada hai. 📥 Download link: ${downloadUrl}`);
        }

        await message.reply({
          body: `🎥 | Apki video "${title}" download karli gayi hai! 💞`,
          attachment: fs.createReadStream(filePath),
        });

        fs.unlinkSync(filePath);
      });

      videoResponse.data.on("error", async (error) => {
        console.error(error);
        fs.unlinkSync(filePath);
        return message.reply(`❌ | Video download karne me masla aya: ${error.message}`);
      });

    } catch (error) {
      console.error(error);

      let errorMessage = "Koi unknown error ho gayi.";
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText || "Server se response nahi mila.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      return message.reply(`❌ | Mujhe video download karne me kuch issues arahe hain: ${errorMessage}`);
    }
  },
};
