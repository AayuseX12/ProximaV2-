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
    if (event.body && (event.body.toLowerCase().includes("randi") || event.body.toLowerCase().includes("kami"))) {
      try {
        const senderID = event.senderID;
        const threadID = event.threadID;

        // Read current warnings for this group from the JSON file
        let warnings = {};
        try {
          warnings = JSON.parse(fs.readFileSync(this.warningFilePath, "utf-8"));
        } catch (error) {
          console.error("Error reading warning file:", error);
        }

        // If the group doesn't have any warnings yet, initialize it
        if (!warnings[threadID]) {
          warnings[threadID] = {};
        }

        // If the user has no warnings yet, initialize them
        if (!warnings[threadID][senderID]) {
          warnings[threadID][senderID] = 0;
        }

        warnings[threadID][senderID]++;

        // Save updated warnings to the file automatically
        fs.writeFileSync(this.warningFilePath, JSON.stringify(warnings), "utf-8");

        // Handle warning system
        if (warnings[threadID][senderID] === 1) {
          api.sendMessage(`${event.senderID}, this is your first warning! Please refrain from using prohibited words.`, threadID);
        }
        else if (warnings[threadID][senderID] === 2) {
          api.sendMessage(`${event.senderID}, this is your second warning! One more and you will be kicked from the group.`, threadID);
        }
        else if (warnings[threadID][senderID] >= 3) {
          api.removeUserFromGroup(senderID, threadID, (err) => {
            if (err) {
              console.error("Error removing user:", err);
            } else {
              console.log(`User with ID ${senderID} has been removed from the group after 3 warnings.`);
              api.sendMessage(`${event.senderID} has been removed from the group after 3 warnings.`, threadID);
            }
          });
        }
      } catch (error) {
        console.error("Error processing the message:", error);
      }
    }
  },
};