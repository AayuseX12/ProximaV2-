const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "Proxima",
    version: "1.0",
    author: "Aayusha",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  warningFilePath: path.join(__dirname, "warningcheck.json"), // Path to the JSON file

  onStart: async function () {
    // Check if warningcheck.json exists; if not, create it with an empty object
    if (!fs.existsSync(this.warningFilePath)) {
      fs.writeFileSync(this.warningFilePath, JSON.stringify({}), "utf-8");
    }
  },

  onChat: async function ({ event, message, api, usersData }) {
    // Check if the message contains prohibited words
    if (event.body && (event.body.toLowerCase().includes("randi") || event.body.toLowerCase().includes("kami"))) {
      try {
        const senderID = event.senderID;

        // Read current warnings from the JSON file
        let warnings = {};
        try {
          warnings = JSON.parse(fs.readFileSync(this.warningFilePath, "utf-8"));
        } catch (error) {
          console.error("Error reading warning file:", error);
        }

        // If user has no warnings yet, initialize them
        if (!warnings[senderID]) {
          warnings[senderID] = 0;
        }

        warnings[senderID]++;

        // Save updated warnings to the file automatically
        fs.writeFileSync(this.warningFilePath, JSON.stringify(warnings), "utf-8");

        // Handle warning system
        if (warnings[senderID] === 1) {
          api.sendMessage(`${event.senderID}, this is your first warning! Please refrain from using prohibited words.`, event.threadID);
        }
        else if (warnings[senderID] === 2) {
          api.sendMessage(`${event.senderID}, this is your second warning! One more and you will be kicked from the group.`, event.threadID);
        }
        else if (warnings[senderID] >= 3) {
          api.removeUserFromGroup(senderID, event.threadID, (err) => {
            if (err) {
              console.error("Error removing user:", err);
            } else {
              console.log(`User with ID ${senderID} has been removed from the group after 3 warnings.`);
              api.sendMessage(`${event.senderID} has been removed from the group after 3 warnings.`, event.threadID);
            }
          });
        }
      } catch (error) {
        console.error("Error processing the message:", error);
      }
    }
  },
};