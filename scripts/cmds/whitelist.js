const fs = require("fs");
const configPath = './config.json'; // Path to your config.json file

module.exports = {
  config: {
    name: 'whitelist',
    aliases: ['wl'],
    version: '1.0',
    author: 'Aayusha',
    role: 2, // Assuming role 2 allows the command, but this will be handled by your system
    category: 'utility',
    shortDescription: {
      en: 'Toggles the whitelist mode on/off.',
    },
    longDescription: {
      en: 'Allows toggling the whitelist mode, restricting bot access to whitelisted users when enabled.',
    },
    guide: {
      en: '{pn} [on/off] - Toggles whitelist mode on or off.',
    },
  },

  onStart: async function ({ api, args, message, event }) {
    // The system already handles role-based access, so no need to manually check permissions

    // Ensure the correct number of arguments
    if (args.length !== 1 || !["on", "off"].includes(args[0].toLowerCase())) {
      return message.reply("Please use 'on' or 'off' to toggle whitelist mode.");
    }

    const action = args[0].toLowerCase();

    try {
      // Load config
      const config = require(configPath);

      if (action === "on") {
        config.whiteListMode.enable = true;
        await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
        message.reply("Whitelist mode has been enabled.");
      } else if (action === "off") {
        config.whiteListMode.enable = false;
        await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
        message.reply("Whitelist mode has been disabled.");
      }
    } catch (error) {
      console.error(error);
      message.reply("Error while trying to change whitelist settings.");
    }
  },
};