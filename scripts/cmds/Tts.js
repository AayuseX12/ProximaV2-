const axios = require('axios');
const fs = require('fs-extra');

module.exports = {
  config: {
    name: "say",
    version: "1.0",
    author: "Aayusha",
    countDown: 5,
    role: 0
  },

  onStart: async function ({ args, message }) {
    const textToSay = args.join(" ");

    if (!textToSay) {
      return message.reply("Please provide text to convert into speech.");
    }

    const filename = './cache/speech.mp3';  

    await fs.ensureDir('./cache');

    try {
      const response = await axios.get('https://api.voicerss.org/', {
        params: {
          key: '5489c686fcd34ab8a98862881cc326d0',
          src: textToSay,
          hl: 'en-us',
          v: 'Anna',          
          c: 'mp3',
          f: '44khz_16bit_stereo',
          r: '-2',
          b: '16',
        },
        responseType: 'arraybuffer',
      });

      await fs.writeFile(filename, response.data, 'binary');

      message.reply({
        body: "Here is your cute speech:",
        attachment: fs.createReadStream(filename),
      });

      fs.remove(filename)
        .then(() => {
          console.log('Speech file removed after sending.');
        })
        .catch((err) => console.error('Error removing the file:', err));

    } catch (error) {
      console.error('Error during TTS API call:', error);
      message.reply("Sorry, there was an error generating the speech.");
    }
  }
};