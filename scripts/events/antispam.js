module.exports = {
  config: {
    name: "antispam",
    version: "1.0.0",
    author: "Aayusha Shrestha",
    countDown: 5,
    role: "admin",
    shortDescription: {
      en: "Prevent spam in groups",
    },
    longDescription: {
      en: "This module detects spam messages in group chats and removes spamming users automatically.",
    },
    category: "moderation",
    guide: {
      en: "{pn} (no additional arguments needed)",
    },
  },
  onEvent: async function ({ api, event, threadsData }) {
    const SPAM_LIMIT = 5; // Number of messages allowed in the time frame
    const TIME_FRAME = 10000; // Time frame in milliseconds (10 seconds)

    const threadID = event.threadID;
    const senderID = event.senderID;

    // Ignore non-group threads
    if (!event.isGroup) return;

    // Initialize thread data if not already done
    if (!threadsData[threadID]) threadsData[threadID] = {};
    const threadSpamTracker = (threadsData[threadID].spamTracker ||= {});

    // Initialize user spam data
    if (!threadSpamTracker[senderID]) {
      threadSpamTracker[senderID] = { messages: [] };
    }

    const userSpamData = threadSpamTracker[senderID];

    // Record message timestamp
    userSpamData.messages.push(Date.now());

    // Filter out messages older than the time frame
    userSpamData.messages = userSpamData.messages.filter(
      (timestamp) => Date.now() - timestamp <= TIME_FRAME
    );

    // Check if user exceeded spam limit
    if (userSpamData.messages.length > SPAM_LIMIT) {
      try {
        await api.removeUserFromGroup(senderID, threadID);
        delete threadSpamTracker[senderID]; // Reset user spam data
        api.sendMessage(`User has been removed for spamming.`, threadID);
      } catch (error) {
        console.error("Error removing user:", error);
        api.sendMessage(
          "Unable to remove user. Please ensure the bot has admin permissions.",
          threadID
        );
      }
    }
  },
};