const { getExtFromUrl, drive, getStreamFromURL } = global.utils;

module.exports = {
    config: {
        name: "antibotname",
        version: "1.0.0",
        author: "Aayusha Shrestha",
        countDown: 5,
        role: 0,
        shortDescription: {
            vi: "Chống đổi tên bot",
            en: "Against changing Bot's nickname"
        },
        longDescription: {
            vi: "Tự động khôi phục tên bot khi có người dùng thay đổi",
            en: "Automatically restore bot name when users try to change it"
        },
        category: "events",
        guide: {
            vi: "Tự động chạy khi có ai đó thay đổi nickname của bot",
            en: "Automatically runs when someone changes the bot's nickname"
        }
    },

    langs: {
        vi: {
            cannotChange: "• %1 - Bạn không thể thay đổi tên của Bot 🔰"
        },
        en: {
            cannotChange: "[#] • %1 - You Cannot Change Bot's Nickname 🔰"
        }
    },

    onStart: async function ({ api, event, args, message, usersData, threadsData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        // This function runs when the event is loaded/started
        return;
    },

    onChat: async function ({ api, event, message, usersData, threadsData, dashBoardData, globalData, threadModel, userModel, dashBoardModel, globalModel, role, commandName, getLang }) {
        // Handle nickname change events
        if (event.logMessageType === "log:user-nickname") {
            const { logMessageData, threadID, author } = event;
            const botID = api.getCurrentUserID();
            
            // Get admin list from global config
            const adminIDs = global.GoatBot.config.adminBot || [];
            
            // Get current thread data
            const threadData = await threadsData.get(threadID);
            const botNickname = threadData.data.nickname || global.GoatBot.config.nickNameBot || "GoatBot";

            // Check if someone changed bot's nickname
            if (logMessageData.participant_id === botID && 
                author !== botID && 
                !adminIDs.includes(author) && 
                logMessageData.nickname !== botNickname) {
                
                try {
                    // Restore original nickname
                    await api.changeNickname(botNickname, threadID, botID);
                    
                    // Get user info
                    const userData = await usersData.get(author);
                    const userName = userData.name || "User";
                    
                    // Send warning message
                    return message.reply(getLang("cannotChange", userName));
                } catch (error) {
                    console.error("Error in antibotname event:", error);
                }
            }
        }
    }
};