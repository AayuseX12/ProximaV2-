const { getTime } = global.utils;
const axios = require('axios');
const fs = require('fs');
const path = require('path');

if (!global.temp.welcomeEvent)
    global.temp.welcomeEvent = {};

module.exports = {
    config: {
        name: "welcome",
        version: "1.0",
        author: "Aayusha",
        category: "events"
    },

    langs: {
        en: {
            session1: "Morning",
            session2: "Noon",
            session3: "Afternoon",
            session4: "Evening",
            multiple1: "you",
            multiple2: "you guys",
            defaultWelcomeMessage: `•>>Namaste, {userName}!🤍🌿.\n•>>Welcome to ChatBox🚠\n•>>Have A Nice {session}🤍☄️`
        }
    },

    onStart: async ({ threadsData, message, event, api, getLang }) => {
        if (event.logMessageType == "log:subscribe")
            return async function () {
                const hours = getTime("HH");
                const { threadID } = event;
                const prefix = global.utils.getPrefix(threadID);
                const dataAddedParticipants = event.logMessageData.addedParticipants;

                // If the new member is the bot itself
                if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
                    return;
                }

                // If new member:
                if (!global.temp.welcomeEvent[threadID])
                    global.temp.welcomeEvent[threadID] = {
                        joinTimeout: null,
                        dataAddedParticipants: []
                    };

                // Push new members to array
                global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
                clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

                // Set new timeout for welcome message
                global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
                    const threadData = await threadsData.get(threadID);
                    if (threadData.settings.sendWelcomeMessage == false) return;

                    const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
                    const threadName = threadData.threadName;
                    const userName = [];
                    const mentions = [];
                    let multiple = false;

                    // Handle multiple members joining
                    if (dataAddedParticipants.length > 1) multiple = true;

                    for (const user of dataAddedParticipants) {
                        userName.push(user.fullName);
                        mentions.push({
                            tag: user.fullName,
                            id: user.userFbId
                        });
                    }

                    // If no new members to greet, return
                    if (userName.length == 0) return;

                    // Get default welcome message and session of the day
                    let { defaultWelcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
                    const form = {
                        mentions: defaultWelcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
                    };

                    defaultWelcomeMessage = defaultWelcomeMessage
                        .replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
                        .replace(/\{boxName\}|\{threadName\}/g, threadName)
                        .replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
                        .replace(/\{session\}/g, hours <= 10 ? getLang("session1") :
                                hours <= 12 ? getLang("session2") :
                                        hours <= 18 ? getLang("session3") : getLang("session4"));

                    form.body = defaultWelcomeMessage;

                    // Fetch the GIF from the URL
                    const gifUrl = 'https://i.imgur.com/TenINd2.gif';  // Example GIF link
                    const gifPath = path.join(__dirname, 'welcome.gif');

                    try {
                        const response = await axios.get(gifUrl, { responseType: 'stream' });
                        const writer = fs.createWriteStream(gifPath);
                        response.data.pipe(writer);

                        writer.on('finish', () => {
                            form.attachment = fs.createReadStream(gifPath);
                            message.send(form);
                        });
                        writer.on('error', (error) => {
                            console.error("Error saving GIF: ", error);
                        });
                    } catch (error) {
                        console.error("Error downloading GIF: ", error);
                    }

                    delete global.temp.welcomeEvent[threadID];
                }, 1500);
            };
    }
}