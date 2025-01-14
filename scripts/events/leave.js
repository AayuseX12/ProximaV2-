const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getTime } = global.utils;

module.exports = {
    config: {
        name: "leave",
        version: "1.5",
        author: "Aayusha",
        category: "events"
    },

    langs: {
        en: {
            session1: "Morning",
            session2: "Noon",
            session3: "Afternoon",
            session4: "Evening",
            leaveType1: "Left!!",
            leaveType2: "Was Kicked!!",
            defaultLeaveMessage: "{userName} has {type} the group."
        }
    },

    onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
        if (event.logMessageType == "log:unsubscribe") {
            const { threadID } = event;
            const threadData = await threadsData.get(threadID);
            if (!threadData.settings.sendLeaveMessage) return;

            const { leftParticipantFbId } = event.logMessageData;
            if (leftParticipantFbId == api.getCurrentUserID()) return;

            const hours = getTime("HH");
            const threadName = threadData.threadName;
            const userName = await usersData.getName(leftParticipantFbId);

            let { leaveMessage = getLang("defaultLeaveMessage") } = threadData.data;
            const form = {
                mentions: leaveMessage.match(/\{userNameTag\}/g) ? [{
                    tag: userName,
                    id: leftParticipantFbId
                }] : null
            };

            leaveMessage = leaveMessage
                .replace(/\{userName\}|\{userNameTag\}/g, userName)
                .replace(/\{type\}/g, leftParticipantFbId == event.author ? getLang("leaveType1") : getLang("leaveType2"))
                .replace(/\{threadName\}|\{boxName\}/g, threadName)
                .replace(/\{time\}/g, hours)
                .replace(/\{session\}/g, hours <= 10 ? getLang("session1") : hours <= 12 ? getLang("session2") : hours <= 18 ? getLang("session3") : getLang("session4"));

            form.body = leaveMessage;

            const gifUrl = 'https://drive.google.com/uc?export=download&id=12Gp1H7SMHhPMgBj9l7NCojMbiFHxkycJ';
            const gifPath = path.join(__dirname, 'leave.gif');

            try {
                const response = await axios.get(gifUrl, { responseType: 'stream' });
                const writer = fs.createWriteStream(gifPath);
                response.data.pipe(writer);

                writer.on('finish', async () => {
                    form.attachment = fs.createReadStream(gifPath);
                    message.send(form);
                });

                writer.on('error', (error) => {
                    console.error("Error saving GIF: ", error);
                });
            } catch (error) {
                console.error("Error downloading GIF: ", error);
                message.send(form); // Send the message without GIF if download fails
            }
        }
    }
};