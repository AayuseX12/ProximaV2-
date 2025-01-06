
const axios = require('axios');
const fs = require('fs');

module.exports = {
  config: {
    name: "say",
    version: "1.0",
    author: "Aayusha",
    countDown: 5,
    role: 0
  },

  onStart: async function ({ args, message }) {
    const textToSay = args.join(" ");  // Join all the arguments to create the full text.

    if (!textToSay) {
      return message.reply("Chalauna aaudaina tmlai?");
    }

    try {
      // Make the API call to iFlytek for text-to-speech.
      const response = await axios.post('https://api.xfyun.cn/v1/service/v1/tts', {
        // Headers with the necessary API credentials
        headers: {
          'Content-Type': 'application/json',
          'X-Appid': 'ga5924ec',  // Your APPID
          'X-Api-Key': 'f9301380e42293334e56b09dc905fd94',  // Your APIKey
        },
        data: {
          // Parameters for TTS, adjust according to the documentation
          text: textToSay,  // The text you want to convert to speech
          voice_name: 'xiaoyan',  // A common voice name, change if needed
          speed: 50,  // Speed of speech (optional)
          volume: 50,  // Volume level (optional)
          pitch: 50,  // Pitch level (optional)
        }
      });

      if (response.data.code === 0) {
        const speechUrl = response.data.data.url;  // URL of the synthesized speech.

        // Check if the cache directory exists, create it if not
        const cacheDir = './cache';
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }

        const filePath = './cache/speech.mp3';
        const writer = fs.createWriteStream(filePath);

        // Download the speech file and save it locally
        const speechResponse = await axios.get(speechUrl, { responseType: 'stream' });
        speechResponse.data.pipe(writer);

        writer.on('finish', () => {
          console.log('File saved to', filePath);
          message.reply({
            body: "Timle Vaneko Vaney!!",
            attachment: filePath  // Attach the local file
          });
        });

        writer.on('error', (error) => {
          console.error('Error saving the file:', error);
          message.reply("Sorry, there was an error saving the speech file.");
        });

      } else {
        message.reply("Sorry, there was an error generating the speech.");
      }

    } catch (error) {
      console.error('Error during TTS API call:', error);
      message.reply("Sorry, there was an error generating the speech.");
    }
  }
};