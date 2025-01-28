let messageInterval; // Declare the interval variable outside the command

module.exports = {
  config: {
    name: "Jpt",
    version: "1.0",
    author: "Aayusha",
    role: 1,
    category: "texts",
    guide: {}
  },

  onStart: async function ({ api, event, args }) {
    const permission = ["100000581316600"]; // Add UIDs with permission

    // Check if the user has permission
    if (!permission.includes(event.senderID)) {
      return api.sendMessage("[#] ONLY MISS AAYUSHA CAN USE THIS COMMAND!! YOU DO NOT HAVE ENOUGH PERMISSION", event.threadID, event.messageID);
    }

    const mention = Object.keys(event.mentions)[0];
    if (!mention) {
      return api.sendMessage("Need to tag 1 friend whom you want to joke with", event.threadID);
    }

    const name = event.mentions[mention].displayName;
    const arraytag = [{ id: mention, tag: name }];
    const messages = [`Randd`
      // Your message array...
    ];

    let messageIndex = 0;
    const interval = 1000;

    // Start the message loop
    messageInterval = setInterval(() => {
      if (messageIndex >= messages.length) {
        messageIndex = 0; // Reset index if it exceeds the length
      }

      api.sendMessage({ body: messages[messageIndex], mentions: arraytag }, event.threadID);
      messageIndex++;
    }, interval);
  },

  // Stop command handler
  onMessage: async function ({ api, event }) {
    if (event.body === "!stopjpt" && event.senderID === event.senderID) {
      clearInterval(messageInterval);
      api.sendMessage("JPT command has been stopped.", event.threadID);
    }
  }
};