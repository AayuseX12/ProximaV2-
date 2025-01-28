const fs = require("fs");

module.exports = {
  config: {
    name: "alert",
    version: "1.2",
    author: "Aayuse",
    countDown: 5,
    role: 0,
    shortDescription: "activity alert",
    longDescription: "Sends an alert if two users are active for more than 10 minutes.",
    category: "alert",
  },

  lastMessageTimestamps: {},

  onStart: async function () {},

  onChat: async function ({ event, api }) {
    const userId = event.senderID;
    const currentTime = Date.now();

    this.lastMessageTimestamps[userId] = currentTime;

    const activeUsers = Object.keys(this.lastMessageTimestamps).filter(id => {
      const timeDifference = currentTime - this.lastMessageTimestamps[id];
      return timeDifference <= 10 * 60 * 1000;
    });

    if (activeUsers.length === 2) {
      try {
        const userInfo = await api.getUserInfo(activeUsers[0], activeUsers[1]);
        const userName1 = userInfo[activeUsers[0]].name;
        const userName2 = userInfo[activeUsers[1]].name;

        // Path to attachment file
        const attachmentPath = "./alert.mp4"; // Change this path to your actual file location

        api.sendMessage(
          {
            body: `⚠️ Hey ${userName1} and ${userName2}, you've both been active for over 10 minutes!`,
            mentions: [
              { tag: userName1, id: activeUsers[0] },
              { tag: userName2, id: activeUsers[1] }
            ],
            attachment: fs.createReadStream(attachmentPath)
          },
          event.threadID
        );

        this.lastMessageTimestamps = {};
      } catch (error) {
        console.error("Error fetching user info or sending alert message:", error);
      }
    }
  },
};