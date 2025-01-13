const fs = require("fs");
const moment = require("moment-timezone"); // Install moment-timezone for time zone support

module.exports = {
  config: {
    name: "sleep",
    version: "2.1.0",
    author: "Aayusha",
    countDown: 0,
    role: 1, // Admin-only command
    shortDescription: {
      en: "Aesthetic sleep mode with time zone support",
    },
    longDescription: {
      en: "Toggle the bot's sleep mode and display the time (in your time zone) when it was activated.",
    },
    category: "System",
    guide: {
      en: "{pn} on - Enable sleep mode\n{pn} off - Disable sleep mode\n{pn} status - Check sleep status",
    },
  },
  onStart: async function ({ args, message, api }) {
    const action = args[0]?.toLowerCase();
    const threadID = message.threadID;
    const sleepDataPath = "./sleepData.json";

    // Specify the time zone (adjust as needed)
    const timeZone = "Asia/Kathmandu"; // Change this to your preferred time zone

    // Load or initialize sleep data
    let sleepData = {};
    if (fs.existsSync(sleepDataPath)) {
      sleepData = JSON.parse(fs.readFileSync(sleepDataPath, "utf8"));
    }

    switch (action) {
      case "on": {
        if (sleepData[threadID]) {
          message.reply(
            `🛌 Sleep mode is already ON since ${sleepData[threadID].time} (${timeZone}).`
          );
          return;
        }

        const currentTime = moment().tz(timeZone).format("YYYY-MM-DD HH:mm:ss");
        sleepData[threadID] = { time: currentTime, timeZone };
        fs.writeFileSync(sleepDataPath, JSON.stringify(sleepData, null, 2));

        message.reply(
          `🌙 Sleep mode activated!\n\n📅 **Time Sleeped:** ${currentTime} (${timeZone})\n` +
            `I won't respond to any messages in this group until sleep mode is turned OFF.`
        );
        break;
      }

      case "off": {
        if (!sleepData[threadID]) {
          message.reply("⚠️ Sleep mode is not currently ON for this group.");
          return;
        }

        const sleepTime = sleepData[threadID].time;
        delete sleepData[threadID];
        fs.writeFileSync(sleepDataPath, JSON.stringify(sleepData, null, 2));

        message.reply(
          `🌞 Sleep mode deactivated!\n\n⏰ **Time Sleeped:** ${sleepTime} (${timeZone})\n` +
            `I am now active and ready to respond again!`
        );
        break;
      }

      case "status": {
        if (sleepData[threadID]) {
          const sleepTime = sleepData[threadID].time;
          message.reply(
            `💤 Sleep mode is currently ON.\n\n📅 **Time Sleeped:** ${sleepTime} (${timeZone})\n` +
              `Use \`{pn} off\` to disable it.`
          );
        } else {
          message.reply("✅ Sleep mode is currently OFF. I am active!");
        }
        break;
      }

      default:
        message.reply(
          "❓ Invalid action. Use one of the following commands:\n" +
            "- `{pn} on` to enable sleep mode.\n" +
            "- `{pn} off` to disable sleep mode.\n" +
            "- `{pn} status` to check sleep mode status."
        );
    }
  },
  onMessage: async function ({ message, api }) {
    const threadID = message.threadID;
    const sleepDataPath = "./sleepData.json";

    if (fs.existsSync(sleepDataPath)) {
      const sleepData = JSON.parse(fs.readFileSync(sleepDataPath, "utf8"));
      if (sleepData[threadID]) {
        // Bot is in sleep mode for this group
        return;
      }
    }
    // Add your usual bot response logic here
  },
};