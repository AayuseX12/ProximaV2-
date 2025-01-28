module.exports = {
  config: {
    name: "botsay",
    version: "1.0",
    author: "Aayuse",
    countDown: 5,
    role: 0,
    shortDescription: "no prefix",
    longDescription: "no prefix",
    category: "no prefix",
  },

  onStart: async function () {},

  onChat: async function ({ event, message, api, usersData }) {
    try {
      const id = event.senderID;
      const userData = await usersData.get(id);
      const name = userData.name;
      const ment = [{ id: id, tag: name }];

      if (event.body && event.body.toLowerCase() === "baby") {
        api.setMessageReaction("🤭", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} Hajur🤭🤍`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "😒") {
        api.setMessageReaction("😒", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} K vo 🥺`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "🙄") {
        api.setMessageReaction("😚", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} Sanu ma yeta xu kata hereko🤭🥺`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "😭") {
        api.setMessageReaction("😂", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} Olele mela babu ko kya huwa😭🥺`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "puti") {
        api.setMessageReaction("👨‍🍳", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} Timro kalo kalo😋`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "lado") {
        api.setMessageReaction("😆", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} Hora🙄`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "bot") {
        api.setMessageReaction("😎", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} Bot na van tero vanda thulo brain xa mero😎`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "good night") {
        api.setMessageReaction("😽", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} Good night sanu🥺🤍`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "pussy") {
        api.setMessageReaction("😗", event.messageID, () => {}, true);
        return message.reply({
          body: `${name} 🥵🤍`,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "") {
        api.setMessageReaction("💋", event.messageID, () => {}, true);
        return message.reply({
          body: ``,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "proxima command") {
        api.setMessageReaction("💋", event.messageID, () => {}, true);
        return message.reply({
          body: ``,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "love you") {
        api.setMessageReaction("💋", event.messageID, () => {}, true);
        return message.reply({
          body: ``,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "happy birthday") {
        api.setMessageReaction("💋", event.messageID, () => {}, true);
        return message.reply({
          body: ``,
          mentions: ment,
        });
      }

      if (event.body && event.body.toLowerCase() === "proxima joke") {
        api.setMessageReaction("💋", event.messageID, () => {}, true);
        return message.reply({
          body: ``,
          mentions: ment,
        });
      }
    } catch (error) {
      console.error("Error processing the event:", error);
    }
  },
};