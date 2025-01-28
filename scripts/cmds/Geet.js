const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");
const axios = require("axios");
const https = require("https");

module.exports = {
  config: {
    name: "music",
    version: "1.0.3",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Download YouTube songs from keywords or links",
    },
    longDescription: {
      en: "Search and download songs or videos from YouTube based on the given keyword or link.",
    },
    category: "media",
    guide: {
      en: "{pn} [songName] [type]\n\nType: audio/video (optional, default is audio)",
    },
  },

  onStart: async function ({ args, message, api }) {
    let songName, type;

    // Parse arguments for song name and type
    if (
      args.length > 1 &&
      (args[args.length - 1] === "audio" || args[args.length - 1] === "video")
    ) {
      type = args.pop();
      songName = args.join(" ");
    } else {
      songName = args.join(" ");
      type = "audio";
    }

    const processingMessage = await message.reply(
      "✅ 𝗠𝗔 𝗧𝗜𝗠𝗥𝗢 𝗕𝗔𝗕𝗬 𝗧𝗔 𝗛𝗔𝗜𝗡𝗔 𝗧𝗘𝗜𝗡𝗘 𝗧𝗜𝗠𝗥𝗢 𝗟𝗔𝗚𝗜 𝗠𝗨𝗦𝗜𝗖 𝗖𝗛𝗔𝗜 𝗦𝗨𝗡𝗔𝗨𝗡𝗔 𝗦𝗔𝗞𝗫𝗨»😄🤍"
    );

    try {
      // Search for the song on YouTube
      const searchResults = await ytSearch(songName);
      if (!searchResults || !searchResults.videos.length) {
        throw new Error("No results found for your search query.");
      }

      // Get the top result from the search
      const topResult = searchResults.videos[0];
      const videoId = topResult.videoId;

      // Construct API URL for downloading the top result
      const apiKey = "priyansh-here";
      const apiUrl = `https://priyansh-ai.onrender.com/youtube?id=${videoId}&type=${type}&apikey=${apiKey}`;

      // Get the direct download URL from the API
      const downloadResponse = await axios.get(apiUrl);
      const downloadUrl = downloadResponse.data.downloadUrl;

      // Set the filename based on the song title and type
      const safeTitle = topResult.title.replace(/[^a-zA-Z0-9 \-_]/g, ""); // Clean the title
      const filename = `${safeTitle}.${type === "audio" ? "mp3" : "mp4"}`;
      const downloadDir = path.join(__dirname, "cache");
      const downloadPath = path.join(downloadDir, filename);

      // Ensure the directory exists
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Download the file and save locally
      const file = fs.createWriteStream(downloadPath);

      await new Promise((resolve, reject) => {
        https.get(downloadUrl, (response) => {
          if (response.statusCode === 200) {
            response.pipe(file);
            file.on("finish", () => {
              file.close(resolve);
            });
          } else {
            reject(
              new Error(`Failed to download file. Status code: ${response.statusCode}`)
            );
          }
        }).on("error", (error) => {
          fs.unlinkSync(downloadPath);
          reject(new Error(`Error downloading file: ${error.message}`));
        });
      });

      // Send the downloaded file to the user
      await message.reply({
        attachment: fs.createReadStream(downloadPath),
        body: `🖤 Title: ${topResult.title}\n\nHere is your ${
          type === "audio" ? "audio" : "video"
        } 🎧:`,
      });

      // Cleanup the downloaded file
      fs.unlinkSync(downloadPath);
    } catch (error) {
      console.error(`Failed to download and send song: ${error.message}`);
      message.reply(`Failed to download song: ${error.message}`);
    } finally {
      // Delete the processing message
      await processingMessage.delete();
    }
  },
};
