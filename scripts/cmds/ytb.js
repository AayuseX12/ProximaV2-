const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");
const { search } = require("youtube-search-api");

module.exports = {
  config: {
    name: "sing",
    version: "1.0.0",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Sing any song 🎵",
    },
    longDescription: {
      en: "Provide the name or URL of a song, and the bot will send the audio from YouTube.",
    },
    category: "fun",
    guide: {
      en: "{pn} <song name or URL> - Sends the audio of the requested song.",
    },
  },
  onStart: async function ({ args, message, api }) {
    // Ensure a song name or URL is provided
    if (!args[0]) {
      return message.reply("Please provide a song name or URL!");
    }

    // Combine arguments into a search query
    const query = args.join(" ");

    // Check if the input is a YouTube URL
    let songURL;
    if (ytdl.validateURL(query)) {
      songURL = query;
    } else {
      // Search YouTube for the song
      const searchResults = await search(query);
      if (!searchResults.items.length) {
        return message.reply("No results found for your query. Please try again!");
      }
      songURL = `https://www.youtube.com/watch?v=${searchResults.items[0].id}`;
    }

    try {
      // Define a temporary file path
      const filePath = path.join(__dirname, "song.mp3");

      // Download the audio
      const audioStream = ytdl(songURL, { filter: "audioonly" });
      const writeStream = fs.createWriteStream(filePath);

      audioStream.pipe(writeStream);

      writeStream.on("finish", async () => {
        // Send the audio file
        await api.sendMessage(
          { attachment: fs.createReadStream(filePath) },
          message.threadID
        );

        // Clean up the temporary file
        fs.unlinkSync(filePath);
      });

      writeStream.on("error", (err) => {
        console.error("Error writing file:", err);
        message.reply("An error occurred while processing your request.");
      });
    } catch (err) {
      console.error("Error downloading audio:", err);
      return message.reply("An error occurred while downloading the song. Please try again.");
    }
  },
};