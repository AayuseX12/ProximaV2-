const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "lockdp",
    version: "3.0.0",
    author: "Aayuse-Project-96",
    countDown: 5,
    role: 2,
    shortDescription: "Lock group display picture",
    longDescription: "Lock the group display picture so only admins can change it",
    category: "admin",
    guide: {
      en: "{pn} [on|off] - Enable or disable group DP lock"
    }
  },

  onStart: async function ({ message, event, api, args, threadsData, usersData }) {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const cacheDir = path.join(__dirname, "cache");
    const dataFile = path.join(cacheDir, "dplock.json");

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // Initialize data file if it doesn't exist
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, JSON.stringify({}));
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch (error) {
      data = {};
    }

    if (!data[threadID]) {
      data[threadID] = { locked: false, imagePath: null };
    }

    // Check if user is admin or bot admin
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    const botAdmins = global.GoatBot?.config?.adminBot || [];
    const isBotAdmin = botAdmins.includes(senderID);

    if (!isAdmin && !isBotAdmin) {
      return message.reply("❌ Only group admins can use this command.");
    }

    if (args[0] === "on") {
      try {
        // Get current thread info
        const info = await api.getThreadInfo(threadID);
        
        if (info.imageSrc) {
          const imgPath = path.join(cacheDir, `dplock_${threadID}.jpg`);
          
          // Download and save current group image
          const response = await axios({
            method: 'GET',
            url: info.imageSrc,
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          fs.writeFileSync(imgPath, response.data);

          data[threadID] = {
            locked: true,
            imagePath: imgPath,
            lockedBy: senderID,
            lockedAt: new Date().toISOString()
          };

          fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
          return message.reply("✅ Group display picture lock enabled! Only admins can change it now.");
        } else {
          return message.reply("⚠️ No group display picture is currently set.");
        }
      } catch (error) {
        console.error("Error enabling DP lock:", error);
        return message.reply("❌ Failed to enable DP lock. Please try again.");
      }
    }

    if (args[0] === "off") {
      data[threadID].locked = false;
      data[threadID].lockedBy = null;
      data[threadID].lockedAt = null;
      
      fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
      return message.reply("✅ Group display picture lock disabled!");
    }

    // Show current status
    const status = data[threadID].locked ? "🔒 Locked" : "🔓 Unlocked";
    return message.reply(`📋 Current DP Lock Status: ${status}\n\n💡 Usage: ${this.config.name} [on|off]`);
  },

  onEvent: async function ({ event, api, threadsData }) {
    // Only handle thread image change events
    if (event.logMessageType !== "log:thread-image") return;

    const threadID = event.threadID;
    const authorID = event.author;
    const cacheDir = path.join(__dirname, "cache");
    const dataFile = path.join(cacheDir, "dplock.json");

    if (!fs.existsSync(dataFile)) return;

    let data;
    try {
      data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    } catch (error) {
      return;
    }

    if (!data[threadID] || !data[threadID].locked) return;

    try {
      // Get thread info to check admin status
      const threadInfo = await api.getThreadInfo(threadID);
      const isAdmin = threadInfo.adminIDs.some(admin => admin.id === authorID);
      const botAdmins = global.GoatBot?.config?.adminBot || [];
      const isBotAdmin = botAdmins.includes(authorID);

      // If admin or bot admin changed the DP, update the saved image
      if (isAdmin || isBotAdmin) {
        if (event.threadImage) {
          const imgPath = path.join(cacheDir, `dplock_${threadID}.jpg`);
          
          const response = await axios({
            method: 'GET',
            url: event.threadImage,
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          fs.writeFileSync(imgPath, response.data);
          data[threadID].imagePath = imgPath;
          fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        }
        return;
      }

      // If unauthorized user changed DP, revert it
      if (data[threadID].imagePath && fs.existsSync(data[threadID].imagePath)) {
        // Wait a moment before reverting to avoid conflicts
        setTimeout(async () => {
          try {
            await api.changeGroupImage(fs.createReadStream(data[threadID].imagePath), threadID);
            
            // Get user info for notification
            const userInfo = await api.getUserInfo(authorID);
            const userName = userInfo[authorID]?.name || "User";
            
            api.sendMessage(
              `❌ Group display picture is locked!\n👤 ${userName}, only group admins can change the display picture.`,
              threadID
            );
          } catch (revertError) {
            console.error("Error reverting DP:", revertError);
            api.sendMessage(
              "❌ Group display picture is locked, but failed to revert the change. Please contact an admin.",
              threadID
            );
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error in DP lock event handler:", error);
    }
  }
};