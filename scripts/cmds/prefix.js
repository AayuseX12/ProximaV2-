const fs = require("fs-extra");
const axios = require("axios");
const { utils } = global;

module.exports = {
    config: {
        name: "prefix",
        version: "1.5",
        author: "Aayusha",
        countDown: 5,
        role: 0,
        description: "Change the command prefix for your chat or the entire bot system (admin only) and add a music prefix with song link support",
        category: "config",
        guide: {
            // guides here...
        }
    },
    langs: {
        // language definitions here...
    },
    onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
        if (!args[0]) return message.SyntaxError();

        // Reset prefix
        if (args[0] === 'reset') {
            await threadsData.set(event.threadID, null, "data.prefix");
            return message.reply(getLang("reset", global.GoatBot.config.prefix));
        }

        // Handle music prefix and link
        if (args[0] === 'music') {
            if (args[1] === 'reset') {
                await threadsData.set(event.threadID, null, "data.musicPrefix");
                return message.reply(getLang("resetMusic", "$"));
            }
            if (args[1] === 'link') {
                const songLink = args[2] || "https://open.spotify.com/track/39ZbD2BuYmJudCHFankou3?si=WlRJSDHUQkS2Ci4oD-8TGQ";
                await threadsData.set(event.threadID, songLink, "data.songLink");
                return message.reply(getLang("successLink", songLink));
            }
            const musicPrefix = args[1];
            await threadsData.set(event.threadID, musicPrefix, "data.musicPrefix");
            return message.reply(getLang("successMusic", musicPrefix));
        }

        const newPrefix = args[0];
        const formSet = { commandName, author: event.senderID, newPrefix, setGlobal: args[1] === "-g" };

        if (formSet.setGlobal && role < 2) return message.reply(getLang("onlyAdmin"));

        return message.reply(
            formSet.setGlobal ? getLang("confirmGlobal") : getLang("confirmThisThread"),
            (err, info) => {
                if (!err) {
                    formSet.messageID = info.messageID;
                    global.GoatBot.onReaction.set(info.messageID, formSet);
                }
            }
        );
    },
    onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
        const { author, newPrefix, setGlobal } = Reaction;
        if (event.userID !== author) return;

        if (setGlobal) {
            global.GoatBot.config.prefix = newPrefix;
            fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
            return message.reply(getLang("successGlobal", newPrefix));
        } else {
            await threadsData.set(event.threadID, newPrefix, "data.prefix");
            return message.reply(getLang("successThisThread", newPrefix));
        }
    },
    onChat: async function ({ event, message, threadsData, getLang }) {
        if (event.body && event.body.toLowerCase() === "prefix") {
            const driveFileUrl = "https://drive.google.com/uc?id=11lDqn1BsfdVsAPyelp5A8pSMjSeTeBir";
            const prefix = await threadsData.get(event.threadID, "data.prefix") || global.GoatBot.config.prefix;
            const musicPrefix = await threadsData.get(event.threadID, "data.musicPrefix") || "$";
            const songLink = await threadsData.get(event.threadID, "data.songLink") || "Not set";

            const prefixInfo = `» MY PREFIX IS [${prefix}]
» MUSIC PREFIX: [${musicPrefix}]
» SONG LINK: ${songLink}`;

            try {
                // Fetch the file from the Google Drive link
                const response = await axios({
                    url: driveFileUrl,
                    method: "GET",
                    responseType: "stream"
                });

                return message.reply({
                    body: prefixInfo,
                    attachment: response.data
                });
            } catch (error) {
                console.error("Failed to fetch the file:", error.message);
                return message.reply("Sorry, I couldn't fetch the attachment.");
            }
        }
    }
};