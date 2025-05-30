const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chatHistoryDir = 'mistralChatHistory';
const apiKey = 'B0H4rJ9cYjb5LhLy7FciZIv7H3rvF3Xk';

const systemPrompt = "Examine the prompt and respond precisely as directed, omitting superfluous information. Provide brief responses, typically 1-2 sentences, except when detailed answers like essays, poems, or stories are requested.";

module.exports = {
    config: {
        name: 'proxi',
        aliases: ['proxima'],
        version: '1.0.0',
        author: 'aayuse',
        countDown: 0,
        role: 0,
        category: 'AI',
        description: {
            en: 'Mistral Model Integration.',
        },
        guide: {
            en: '{pn} [question]',
        },
    },
    onStart: async function ({ api, message, event, args, commandName, usersData }) {
        var prompt = args.join(" ");
        let chatHistory = [];
        const id = event.senderID;
        const userData = await usersData.get(id);
        const name = userData.name;
        const ment = [{ id: id, tag: name }];

        if (prompt.toLowerCase() === "clear") {
            clearChatHistory(id);
            message.reply("Chat history cleared!");
            return;
        }

        var content = event.type === "message_reply" ? event.messageReply.body : args.join(" ");
        var targetMessageID = event.type === "message_reply" ? event.messageReply.messageID : event.messageID;

        if (event.type === "message_reply") {
            content = content + " " + prompt;
            clearChatHistory(id);

            api.setMessageReaction("⌛", event.messageID, () => {}, true);

            try {
                const chatMessages = [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": content }
                ];

                const chatCompletion = await sendMistralRequest(chatMessages);
                const assistantResponse = chatCompletion.choices[0].message.content;

                let finalMessage = `${name}, ${assistantResponse}`;

                api.sendMessage({ body: finalMessage, mentions: ment }, event.threadID, (err, info) => {
                    if (!err) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName,
                            messageID: info.messageID,
                            replyToMessageID: targetMessageID
                        });
                    }
                });

                chatHistory.push({ role: "user", content: prompt });
                chatHistory.push({ role: "assistant", content: assistantResponse });
                appendToChatHistory(targetMessageID, chatHistory);

                api.setMessageReaction("✅", event.messageID, () => {}, true);
            } catch (error) {
                console.error("Error in chat completion:", error);
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return message.reply(`An error occurred: ${error}`);
            }
        } else {
            clearChatHistory(id);

            if (args.length == 0 && prompt == "") {
                message.reply("Please provide a prompt.");
                return;
            }

            api.setMessageReaction("⌛", event.messageID, () => {}, true);

            try {
                const chatMessages = [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": prompt }
                ];

                const chatCompletion = await sendMistralRequest(chatMessages);
                const assistantResponse = chatCompletion.choices[0].message.content;

                let finalMessage = `${name}, ${assistantResponse}`;

                api.sendMessage({ body: finalMessage, mentions: ment }, event.threadID, (err, info) => {
                    if (!err) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName,
                            messageID: info.messageID
                        });
                    }
                });

                chatHistory.push({ role: "user", content: prompt });
                chatHistory.push({ role: "assistant", content: assistantResponse });
                appendToChatHistory(id, chatHistory);

                api.setMessageReaction("✅", event.messageID, () => {}, true);
            } catch (error) {
                console.error("Error in chat completion:", error);
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return message.reply(`An error occurred: ${error}`);
            }
        }
    },
    onReply: async function ({ api, message, event, Reply, args, usersData }) {
        var prompt = args.join(" ");
        const id = event.senderID;
        const userData = await usersData.get(id);
        const name = userData.name;
        const ment = [{ id: id, tag: name }];

        if (!global.GoatBot.onReply.has(event.messageReply.messageID)) return;

        if (prompt.toLowerCase() === "clear") {
            clearChatHistory(id);
            message.reply("Chat history cleared!");
            return;
        }

        api.setMessageReaction("⌛", event.messageID, () => {}, true);

        try {
            const chatHistory = loadChatHistory(id);

            const chatMessages = [
                { "role": "system", "content": systemPrompt },
                ...chatHistory,
                { "role": "user", "content": prompt }
            ];

            const chatCompletion = await sendMistralRequest(chatMessages);
            const assistantResponse = chatCompletion.choices[0].message.content;

            let finalMessage = `${name}, ${assistantResponse}`;

            message.reply({ body: finalMessage, mentions: ment }, (err, info) => {
                if (!err) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: Reply.commandName,
                        messageID: info.messageID
                    });
                }
            });

            chatHistory.push({ role: "user", content: prompt });
            chatHistory.push({ role: "assistant", content: assistantResponse });
            appendToChatHistory(id, chatHistory);

            api.setMessageReaction("✅", event.messageID, () => {}, true);
        } catch (error) {
            console.error("Error in chat completion:", error);
            message.reply(error.message);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
        }
    }
};

async function sendMistralRequest(messages) {
    try {
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-large-latest',
            messages: messages
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error("Error in Mistral API request:", error);
        throw error;
    }
}

function loadChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (fs.existsSync(chatHistoryFile)) {
            return JSON.parse(fs.readFileSync(chatHistoryFile, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error(`Error loading chat history:`, error);
        return [];
    }
}

function appendToChatHistory(uid, chatHistory) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (!fs.existsSync(chatHistoryDir)) {
            fs.mkdirSync(chatHistoryDir);
        }
        fs.writeFileSync(chatHistoryFile, JSON.stringify(chatHistory, null, 2));
    } catch (error) {
        console.error(`Error saving chat history:`, error);
    }
}

function clearChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        fs.unlinkSync(chatHistoryFile);
    } catch (err) {
        console.error("Error deleting chat history file:", err);
    }
      }