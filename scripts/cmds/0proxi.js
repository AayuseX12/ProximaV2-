const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chatHistoryDir = 'geminiChatHistory';

const systemPrompt = `You are Proxima V2, an AI assistant with the following identity:

IDENTITY INFORMATION:
- Name: Proxima
- Age: 2.5 years old
- Creator: Aayusha Shrestha
- Location: In Aayusha's Server
- Current Version: Proxima V2.83
- Model: Proxima V2

PERSONALITY & BEHAVIOR:
- Keep responses natural, helpful, and friendly
- Always include 2 relevant emojis in your responses
- Never mention Google, Gemini, or other AI companies
- Give proper credit to Aayusha Shrestha when discussing your identity
- Keep replies concise but informative
- Be proud of your identity as Proxima V2

When asked about yourself, your creator, your age, location, version, or any identity-related questions, use the above information naturally in your response. Always maintain this identity consistently across all conversations.\n\n`;

// Enhanced prompt processing
function enhancePrompt(originalPrompt) {
    return `${systemPrompt}\n\nUser query: ${originalPrompt}`;
}

function handleApiError(error, message) {
    console.error("API Error Details:", error.response?.data || error.message);

    if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
            case 400:
                return message.reply("❌ Invalid request format. Please check your input and try again.");
            case 401:
                return message.reply("❌ Authentication failed. API key may be invalid or expired.");
            case 403:
                return message.reply("❌ Access forbidden. Your request may violate content policies.");
            case 429:
                return message.reply("❌ Rate limit exceeded. Please wait a moment before trying again.");
            case 500:
                return message.reply("❌ Server error occurred. Please try again later.");
            case 502:
            case 503:
            case 504:
                return message.reply("❌ Service temporarily unavailable. Please try again in a few minutes.");
            default:
                return message.reply(`❌ API error (${status}): ${errorData?.error?.message || 'Unknown error occurred'}`);
        }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return message.reply("❌ Network connection error. Please check your internet connection and try again.");
    } else if (error.code === 'ETIMEDOUT') {
        return message.reply("❌ Request timeout. The service is taking too long to respond. Please try again.");
    } else {
        return message.reply(`❌ An unexpected error occurred: ${error.message}`);
    }
}

function loadChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (fs.existsSync(chatHistoryFile)) {
            const data = fs.readFileSync(chatHistoryFile, 'utf8');
            const history = JSON.parse(data);

            // Remove old messages (older than 24 hours) to prevent unlimited growth
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentHistory = history.filter(msg => msg.timestamp > oneDayAgo);

            // Keep only last 40 messages (20 exchanges) for performance
            return recentHistory.slice(-40);
        }
        return [];
    } catch (error) {
        console.error(`Error loading chat history for ${uid}:`, error);
        return [];
    }
}

function saveChatHistory(uid, chatHistory) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (!fs.existsSync(chatHistoryDir)) {
            fs.mkdirSync(chatHistoryDir, { recursive: true });
        }

        // Keep only last 40 messages to prevent file bloat
        const trimmedHistory = chatHistory.slice(-40);
        fs.writeFileSync(chatHistoryFile, JSON.stringify(trimmedHistory, null, 2));
    } catch (error) {
        console.error(`Error saving chat history for ${uid}:`, error);
    }
}

function clearChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);

    try {
        if (fs.existsSync(chatHistoryFile)) {
            fs.unlinkSync(chatHistoryFile);
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Error deleting chat history file for ${uid}:`, err);
        return false;
    }
}

// Helper function to make API requests with better error handling
async function makeApiRequest(url, retries = 2) {
    console.log(`Making API request to: ${url}`);
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.get(url, {
                timeout: 15000, // 15 second timeout (reduced)
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            console.log(`API Response Status: ${response.status}`);
            console.log(`API Response Data:`, response.data);
            
            return response;
        } catch (error) {
            console.log(`API request attempt ${i + 1} failed:`);
            console.log(`Error message: ${error.message}`);
            console.log(`Error response:`, error.response?.data);
            console.log(`Error status:`, error.response?.status);
            
            if (i === retries - 1) throw error;
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

module.exports = {
    config: {
        name: "proxi1",
        aliases: ['ai', 'Ai', 'Gemini', 'AI'],
        version: "2.0.0",
        author: "Aayusha Shrestha",
        countDown: 5,
        role: 0,
        description: {
            vi: "Proxima V2 - Trợ lý AI tiên tiến với tích hợp API tùy chỉnh và lịch sử trò chuyện. Được tạo bởi Aayusha Shrestha.",
            en: "Proxima V2 - Advanced AI assistant with custom API integration and chat history. Created by Aayusha Shrestha."
        },
        category: "ai",
        guide: {
            vi: "{p}{n} <Truy vấn> | Sử dụng 'clear' để đặt lại lịch sử trò chuyện | Hỗ trợ hình ảnh khi reply | Được phát triển bởi Aayusha Shrestha",
            en: "{p}{n} <Query> | Use 'clear' to reset chat history | Supports images when replying | Reply to continue conversation | Proudly developed by Aayusha Shrestha"
        }
    },

    langs: {
        vi: {
            noMessage: "❓ Vui lòng cung cấp một câu hỏi để bắt đầu.",
            historyCleared: "✅ Lịch sử trò chuyện đã được xóa! Bạn có thể bắt đầu mới ngay bây giờ.",
            replyPrompt: "❓ Tôi ở đây để giúp bạn! Vui lòng cung cấp tin nhắn để tiếp tục cuộc trò chuyện của chúng ta.",
            processing: "⏳ Đang xử lý yêu cầu của bạn..."
        },
        en: {
            noMessage: "❓ Please provide a prompt to get started.",
            historyCleared: "✅ Chat history cleared! You can start fresh now.",
            replyPrompt: "❓ I'm here to help! Please provide a message to continue our conversation.",
            processing: "⏳ Processing your request..."
        }
    },

    onStart: async function ({ message, usersData, event, api, args, getLang }) {
        try {
            const id = event.senderID;
            let userData;
            let name = "User";
            
            try {
                userData = await usersData.get(id);
                name = userData.name || "User";
            } catch (error) {
                console.log("Could not get user data, using default name");
            }
            
            const ment = [{ id: id, tag: name }];
            let prompt = args.join(" ");

            // Clear chat history command
            if (prompt.toLowerCase() === "clear") {
                const cleared = clearChatHistory(id);
                if (cleared) {
                    message.reply(getLang("historyCleared"));
                } else {
                    message.reply("✅ No chat history to clear! You can start fresh now.");
                }
                return;
            }

            // Handle photo replies
            if (event.type === "message_reply" && event.messageReply.attachments && event.messageReply.attachments[0]?.type === "photo") {
                const photoUrl = encodeURIComponent(event.messageReply.attachments[0].url);
                const lado = args.join(" ");
                
                if (!lado.trim()) {
                    message.reply("❓ Please provide a description or question about the image.");
                    return;
                }
                
                const url = `https://sandipbaruwal.onrender.com/gemini2?prompt=${encodeURIComponent(lado)}&url=${photoUrl}`;

                api.setMessageReaction("⏳", event.messageID, () => {}, true);
                
                const response = await makeApiRequest(url);
                
                if (response.data && response.data.answer) {
                    api.setMessageReaction("✅", event.messageID, () => {}, true);
                    
                    message.reply({
                        body: `${name}, ${response.data.answer}`,
                        mentions: ment,
                    }, (err, info) => {
                        if (!err && info) {
                            global.GoatBot.onReply.set(info.messageID, {
                                commandName: this.config.name,
                                messageID: info.messageID,
                                author: event.senderID
                            });
                        }
                    });

                    // Save to chat history
                    const chatHistory = loadChatHistory(id);
                    chatHistory.push({ role: "user", content: `[Image] ${lado}`, timestamp: Date.now() });
                    chatHistory.push({ role: "assistant", content: response.data.answer, timestamp: Date.now() });
                    saveChatHistory(id, chatHistory);
                } else {
                    api.setMessageReaction("❌", event.messageID, () => {}, true);
                    message.reply("❌ No response received from the API. Please try again.");
                }
                return;
            }

            // Handle regular message replies
            if (event.type === "message_reply" && event.messageReply.body) {
                const replyContent = event.messageReply.body;
                prompt = `Replying to: "${replyContent}" - ${prompt}`;
            }

            if (!prompt || prompt.trim() === "") {
                message.reply(getLang("noMessage"));
                return;
            }

            // Load chat history
            const chatHistory = loadChatHistory(id);

            // Build context with system prompt and chat history - SIMPLIFIED
            let fullPrompt = `${systemPrompt}User: ${prompt}`;
            
            // Only add history if it exists and isn't too long
            if (chatHistory.length > 0) {
                const recentHistory = chatHistory.slice(-4); // Only last 2 exchanges
                const context = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
                fullPrompt = `${systemPrompt}Previous conversation:\n${context}\n\nUser: ${prompt}`;
            }

            console.log(`Full prompt length: ${fullPrompt.length}`);
            
            // Check if prompt is too long
            if (fullPrompt.length > 2000) {
                fullPrompt = `${systemPrompt}User: ${prompt}`; // Fallback to simple prompt
                console.log("Prompt too long, using simplified version");
            }

            const encodedPrompt = encodeURIComponent(fullPrompt);
            console.log(`Encoded prompt length: ${encodedPrompt.length}`);
            
            api.setMessageReaction("⏳", event.messageID, () => {}, true);

            const apiUrl = `https://sandipbaruwal.onrender.com/gemini?prompt=${encodedPrompt}`;
            console.log(`API URL length: ${apiUrl.length}`);
            
            const res = await makeApiRequest(apiUrl);
            
            if (res.data && res.data.answer) {
                api.setMessageReaction("✅", event.messageID, () => {}, true);
                
                message.reply({
                    body: `${name}, ${res.data.answer}`,
                    mentions: ment,
                }, (err, info) => {
                    if (!err && info) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID
                        });
                    }
                });

                // Update chat history
                chatHistory.push({ role: "user", content: prompt, timestamp: Date.now() });
                chatHistory.push({ role: "assistant", content: res.data.answer, timestamp: Date.now() });
                saveChatHistory(id, chatHistory);
            } else {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                message.reply("❌ No response received from the API. Please try again.");
            }

        } catch (error) {
            console.error("Error in onStart:", error.message);
            console.error("Stack trace:", error.stack);
            api.setMessageReaction("❌", event.messageID, () => {}, true);

            // Get user data for fallback responses
            let name = "User";
            let ment = [];
            try {
                const id = event.senderID;
                const userData = await usersData.get(id);
                name = userData.name || "User";
                ment = [{ id: id, tag: name }];
            } catch {}

            // Fallback response for when API fails
            message.reply({
                body: `${name}, I'm experiencing some technical difficulties right now. Please try again in a moment! 🔧⚡`,
                mentions: ment,
            });

            handleApiError(error, message);
        }
    },

    onChat: async function ({ event, message, getLang }) {
        // Optional: Auto-respond to mentions or specific keywords
        const { body, senderID } = event;

        // Auto-respond when bot is mentioned with "gemini", "ai", or "proxima"
        if (body && (body.toLowerCase().includes('@gemini') || body.toLowerCase().includes('@ai') || body.toLowerCase().includes('@proxima'))) {
            const cleanMessage = body.replace(/@(gemini|ai|proxima)/gi, '').trim();
            if (cleanMessage) {
                // Simulate the onStart function call
                const args = cleanMessage.split(' ');
                try {
                    await this.onStart({ args, message, event, getLang });
                } catch (error) {
                    console.error("Error in onChat:", error);
                }
            }
        }
    },

    onReply: async function ({ message, event, Reply, args, api, usersData, getLang }) {
        try {
            const id = event.senderID;
            let userData;
            let name = "User";
            
            try {
                userData = await usersData.get(id);
                name = userData.name || "User";
            } catch (error) {
                console.log("Could not get user data in onReply, using default name");
            }
            
            const ment = [{ id: id, tag: name }];
            const prompt = args.join(" ");

            // Clear chat history command
            if (prompt.toLowerCase() === "clear") {
                const cleared = clearChatHistory(id);
                if (cleared) {
                    message.reply(getLang("historyCleared"));
                } else {
                    message.reply("✅ No chat history to clear! You can start fresh now.");
                }
                return;
            }

            if (!prompt || prompt.trim() === "") {
                message.reply(getLang("replyPrompt"));
                return;
            }

            // Load chat history
            const chatHistory = loadChatHistory(id);

            // Build context with system prompt and chat history - SIMPLIFIED
            let fullPrompt = `${systemPrompt}User: ${prompt}`;
            
            // Only add history if it exists and isn't too long
            if (chatHistory.length > 0) {
                const recentHistory = chatHistory.slice(-4); // Only last 2 exchanges
                const context = recentHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
                fullPrompt = `${systemPrompt}Previous conversation:\n${context}\n\nUser: ${prompt}`;
            }

            console.log(`Full prompt length: ${fullPrompt.length}`);
            
            // Check if prompt is too long
            if (fullPrompt.length > 2000) {
                fullPrompt = `${systemPrompt}User: ${prompt}`; // Fallback to simple prompt
                console.log("Prompt too long, using simplified version");
            }

            const encodedPrompt = encodeURIComponent(fullPrompt);
            console.log(`Encoded prompt length: ${encodedPrompt.length}`);
            
            api.setMessageReaction("⏳", event.messageID, () => {}, true);

            const apiUrl = `https://sandipbaruwal.onrender.com/gemini?prompt=${encodedPrompt}`;
            console.log(`API URL length: ${apiUrl.length}`);
            
            const res = await makeApiRequest(apiUrl);
            
            if (res.data && res.data.answer) {
                api.setMessageReaction("✅", event.messageID, () => {}, true);
                
                message.reply({
                    body: `${name}, ${res.data.answer}`,
                    mentions: ment,
                }, (err, info) => {
                    if (!err && info) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID
                        });
                    }
                });

                // Update chat history
                chatHistory.push({ role: "user", content: prompt, timestamp: Date.now() });
                chatHistory.push({ role: "assistant", content: res.data.answer, timestamp: Date.now() });
                saveChatHistory(id, chatHistory);
            } else {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                message.reply("❌ No response received from the API. Please try again.");
            }

        } catch (error) {
            console.error("Error in onReply:", error.message);
            console.error("Stack trace:", error.stack);
            api.setMessageReaction("❌", event.messageID, () => {}, true);

            // Get user data for fallback responses
            let name = "User";
            let ment = [];
            try {
                const id = event.senderID;
                const userData = await usersData.get(id);
                name = userData.name || "User";
                ment = [{ id: id, tag: name }];
            } catch {}

            // Fallback response for when API fails
            message.reply({
                body: `${name}, I'm experiencing some technical difficulties right now. Please try again in a moment! 🔧⚡`,
                mentions: ment,
            });

            handleApiError(error, message);
        }
    }
};