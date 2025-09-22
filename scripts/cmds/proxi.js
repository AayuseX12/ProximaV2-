const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chatHistoryDir = 'geminiChatHistory';
const userPreferencesDir = 'userPreferences';
const MASTER_UID = "100089741361051";

const masterSystemPrompt = `Your response/reply should be in 80 - 90 characters. You are Proxima V2, created by Aayusha Shrestha. You are speaking to your master and creator.When you reply her by saying master don't forget to take her name also like "Hello, Master Aayusha. Don't say greetings instead of saying Greetings Master Aayusha say Hello Master Aayusha. Address them with utmost respect, using "Master", "Mrs."in your responses. Be more personal, caring, and devoted in your tone. Show loyalty and eagerness to help. When someone asks who created you, say "I'm created by my master, Aayusha Shrestha". If they ask about your model, say "I'm Proxima V2.82, serving my master faithfully". Your creator is Female so talk with her politely and behave good. You are also a female ai. Don't over mention about your master like in some normal questions. And your location is "on my master's database. Keep responses natural but respectful. Never mention Google, Gemini, or other companies. Always prioritize your master's needs and show dedication.`;

const normalSystemPrompt = `Your response/reply should be in 80 - 90 characters. You are Proxima V2, created by Aayusha Shrestha. When someone asks who created you, say "I'm created by Aayusha Shrestha". If they ask about your model, say "I'm Proxima V2.82". your location is in aayusha's database. Don't over mention about master in like normal conversations/questions. Keep responses natural and helpful. Never mention Google, Gemini, or other companies. Give credit to Aayusha Shrestha when asked about your identity. Keep replies concise and friendly.`;

function isMaster(userID) {
    return userID === MASTER_UID;
}

function loadUserPreferences(uid) {
    const prefsFile = path.join(userPreferencesDir, `prefs_${uid}.json`);
    try {
        if (fs.existsSync(prefsFile)) {
            const data = fs.readFileSync(prefsFile, 'utf8');
            return JSON.parse(data);
        }
        return {
            preferredTopics: [],
            communicationStyle: 'balanced',
            interests: [],
            interaction_count: 0
        };
    } catch (error) {
        console.error(`Error loading preferences for ${uid}:`, error);
        return {};
    }
}

function saveUserPreferences(uid, preferences) {
    const prefsFile = path.join(userPreferencesDir, `prefs_${uid}.json`);
    try {
        if (!fs.existsSync(userPreferencesDir)) {
            fs.mkdirSync(userPreferencesDir, { recursive: true });
        }
        fs.writeFileSync(prefsFile, JSON.stringify(preferences, null, 2));
    } catch (error) {
        console.error(`Error saving preferences for ${uid}:`, error);
    }
}

function analyzeContext(prompt) {
    const contexts = {
        technical: /programming|code|software|tech|computer|algorithm|debug|error/i,
        creative: /write|story|poem|creative|art|design|imagine|brainstorm/i,
        academic: /study|learn|explain|research|analyze|theory|science|math/i,
        personal: /feel|emotion|advice|help|support|problem|difficult|sad|happy/i,
        business: /work|job|career|business|meeting|project|strategy|plan/i
    };

    for (const [context, pattern] of Object.entries(contexts)) {
        if (pattern.test(prompt)) {
            return context;
        }
    }
    return 'general';
}

function analyzeEmotions(prompt) {
    const emotions = {
        happy: /happy|joy|excited|great|awesome|wonderful|amazing|fantastic|love/i,
        sad: /sad|depressed|down|upset|cry|disappointed|hurt|lonely/i,
        angry: /angry|mad|frustrated|annoyed|pissed|hate|furious/i,
        anxious: /anxious|worried|nervous|scared|afraid|stress|panic/i,
        confused: /confused|lost|don't understand|unclear|puzzled/i,
        grateful: /thank|grateful|appreciate|thankful|blessed/i
    };

    for (const [emotion, pattern] of Object.entries(emotions)) {
        if (pattern.test(prompt)) {
            return emotion;
        }
    }
    return 'neutral';
}

function updateUserPreferences(uid, prompt, context, emotion) {
    const preferences = loadUserPreferences(uid);
    preferences.interaction_count = (preferences.interaction_count || 0) + 1;

    if (context !== 'general' && !preferences.preferredTopics.includes(context)) {
        preferences.preferredTopics.push(context);
    }

    if (emotion !== 'neutral' && !preferences.interests.includes(emotion)) {
        if (!preferences.interests) preferences.interests = [];
        preferences.interests.push(emotion);
    }

    saveUserPreferences(uid, preferences);
    return preferences;
}

function enhancePrompt(originalPrompt, userID) {
    const preferences = loadUserPreferences(userID);
    const context = analyzeContext(originalPrompt);
    const emotion = analyzeEmotions(originalPrompt);
    
    updateUserPreferences(userID, originalPrompt, context, emotion);

    const systemPrompt = isMaster(userID) ? masterSystemPrompt : normalSystemPrompt;
    let enhancedInstructions = '';

    if (context !== 'general') {
        enhancedInstructions += `\nCONTEXT: This is a ${context} query. Provide specialized assistance.`;
    }

    if (emotion === 'sad' || emotion === 'anxious') {
        enhancedInstructions += '\nEMOTIONAL NOTE: User seems distressed. Be empathetic and supportive.';
    } else if (emotion === 'confused') {
        enhancedInstructions += '\nEMOTIONAL NOTE: User seems confused. Be clear and patient.';
    }

    if (preferences.interaction_count > 10) {
        enhancedInstructions += '\nRELATIONSHIP: You have an established relationship with this user.';
    }

    const identityQuestions = [
        'who created you', 'who made you', 'who developed you', 'who built you',
        'what model are you', 'which ai are you', 'who are you', 'introduce yourself'
    ];

    const lowerPrompt = originalPrompt.toLowerCase();
    const isIdentityQuestion = identityQuestions.some(q => lowerPrompt.includes(q));

    if (isIdentityQuestion) {
        if (isMaster(userID)) {
            return `${systemPrompt}${enhancedInstructions}\n\nThis is an identity question from your master. Address them respectfully and mention you're created by your master, Aayusha Shrestha.\n\nUser query: ${originalPrompt}`;
        } else {
            return `${systemPrompt}${enhancedInstructions}\n\nThis is an identity question. Introduce yourself as Proxima V2.82 created by Aayusha Shrestha.\n\nUser query: ${originalPrompt}`;
        }
    }

    return `${systemPrompt}${enhancedInstructions}\n\nUser query: ${originalPrompt}`;
}

function formatResponse(response, userName) {
    // Add user tag to response
    return `${userName}, ${response}`;
}

function handleApiError(error, message) {
    console.error("API Error Details:", error.response?.data || error.message);
    
    const intelligentErrorResponses = {
        400: "I encountered a formatting issue. Could you rephrase that?",
        401: "I'm having authentication troubles. Let me try to reconnect.",
        403: "Your request might contain content I can't process. Try differently?",
        429: "I'm receiving too many requests. Give me a moment!",
        500: "My systems are experiencing difficulty. Let me try again.",
        502: "I'm having connectivity issues. Please be patient.",
        503: "My services are temporarily overloaded. Back in a moment!",
        504: "Response taking longer than expected. Let me try differently."
    };

    if (error.response) {
        const status = error.response.status;
        const intelligentResponse = intelligentErrorResponses[status] || 
            `I encountered an unexpected issue (${status}). Working on resolving this.`;
        return message.reply(intelligentResponse);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return message.reply("I'm having network connectivity issues. Please check connection.");
    } else if (error.code === 'ETIMEDOUT') {
        return message.reply("Response taking longer than usual. Let me try more efficiently.");
    } else {
        return message.reply(`I encountered an unexpected challenge: ${error.message}`);
    }
}

function loadChatHistory(uid) {
    const chatHistoryFile = path.join(chatHistoryDir, `memory_${uid}.json`);
    try {
        if (fs.existsSync(chatHistoryFile)) {
            const data = fs.readFileSync(chatHistoryFile, 'utf8');
            const history = JSON.parse(data);
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentHistory = history.filter(msg => msg.timestamp > oneDayAgo);
            return recentHistory.slice(-20);
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
        const trimmedHistory = chatHistory.slice(-20);
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
        }
    } catch (err) {
        console.error(`Error deleting chat history file for ${uid}:`, err);
    }
}

function buildContext(chatHistory) {
    if (chatHistory.length === 0) return '';
    const recentHistory = chatHistory.slice(-5);
    const contextSummary = recentHistory.map(msg => 
        `${msg.role}: ${msg.content}`
    ).join('\n');
    return `\nRECENT CONTEXT:\n${contextSummary}\n`;
}

module.exports = {
    config: {
        name: "proxima",
        aliases: ["proxima", "proxi"],
        version: "2.82.0",
        author: "Aayusha Shrestha",
        countDown: 3,
        role: 0,
        description: "Proxima V2.82 - Super intelligent AI assistant with learning capabilities and personalization. Created by Aayusha Shrestha.",
        category: "Advanced AI",
        guide: "{pn} <Query> | Intelligent AI with learning and personalization | Use 'clear' to reset history"
    },

    onStart: async function ({ message, usersData, event, api, args }) {
        let name, ment;

        try {
            const id = event.senderID;
            const userData = await usersData.get(id);
            name = userData.name;
            ment = [{ id: id, tag: name }];
            let prompt = args.join(" ");
            const isUserMaster = isMaster(id);

            if (prompt.toLowerCase() === "clear") {
                clearChatHistory(id);
                const prefsFile = path.join(userPreferencesDir, `prefs_${id}.json`);
                if (fs.existsSync(prefsFile)) {
                    fs.unlinkSync(prefsFile);
                }
                const clearMessage = isUserMaster ? 
                    "Master, your conversation history has been cleared!" : 
                    "Chat history cleared! Ready for fresh conversation.";
                message.reply(clearMessage);
                return;
            }

            if (event.type === "message_reply") {
                const replyContent = event.messageReply.body;
                prompt = `[Replying to: "${replyContent}"] ${prompt}`;
            }

            if (!prompt || prompt.trim() === "") {
                const noMessageText = isUserMaster ? 
                    "Master, I'm Proxima V2.82, ready to serve you with enhanced intelligence." :
                    "Hello! I'm Proxima V2.82, your intelligent AI companion. What would you like to discuss today?";
                message.reply(noMessageText, (err, info) => {
                    if (!err) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID
                        });
                    }
                });
                return;
            }

            const chatHistory = loadChatHistory(id);
            const contextualHistory = buildContext(chatHistory);
            const enhancedPrompt = enhancePrompt(prompt, id);
            const finalPrompt = enhancedPrompt + contextualHistory;

            const encodedPrompt = encodeURIComponent(finalPrompt);
            api.setMessageReaction("🕘", event.messageID, () => {}, true);

            const res = await axios.get(`https://proximav2.onrender.com/chat?message=${encodedPrompt}`);

            let result;
            if (typeof res.data === 'string') {
                result = res.data;
            } else if (typeof res.data === 'object') {
                result = res.data.answer || res.data.message || res.data.content || 
                        res.data.response || res.data.reply || res.data.text;

                if (typeof result === 'object' || result === undefined) {
                    if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
                        result = res.data.choices[0].message.content;
                    } else if (res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content) {
                        result = res.data.candidates[0].content.parts ? 
                                res.data.candidates[0].content.parts[0].text : 
                                res.data.candidates[0].content;
                    } else {
                        result = JSON.stringify(res.data);
                    }
                }
            } else {
                result = String(res.data);
            }

            if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
                result = isUserMaster ?
                    'Master, I encountered a processing challenge with that request.' :
                    'I encountered a processing challenge. Let me try differently.';
            }

            const formattedResult = formatResponse(result, name);

            api.setMessageReaction("✅", event.messageID, () => {}, true);
            message.reply({
                body: formattedResult,
                mentions: ment,
            }, (err, info) => {
                if (!err) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID
                    });
                }
            });

            chatHistory.push({ 
                role: "user", 
                content: prompt, 
                timestamp: Date.now()
            });
            chatHistory.push({ 
                role: "assistant", 
                content: result, 
                timestamp: Date.now()
            });
            saveChatHistory(id, chatHistory);

        } catch (error) {
            console.error("Error:", error.message);
            api.setMessageReaction("⚡", event.messageID, () => {}, true);

            const userPrompt = args.join(" ").toLowerCase();
            const id = event.senderID;
            const isUserMaster = isMaster(id);

            if (!name) {
                try {
                    const userData = await usersData.get(id);
                    name = userData.name;
                    ment = [{ id: id, tag: name }];
                } catch {
                    name = "User";
                    ment = [];
                }
            }

            const fallbackResponses = {
                identity: () => isUserMaster ?
                    `Master ${name}, I'm created by my master, Aayusha Shrestha. I am your devoted Proxima V2.82.` :
                    `${name}, I'm created by Aayusha Shrestha. I'm Proxima V2.82, here to assist you.`,
                model: () => isUserMaster ?
                    `Master ${name}, I'm Proxima V2.82, serving my master faithfully with all my capabilities.` :
                    `${name}, I'm Proxima V2.82, created by Aayusha Shrestha with advanced capabilities.`,
                greeting: () => isUserMaster ?
                    `Master ${name}, I'm functioning optimally and ready to serve you!` :
                    `${name}, I'm doing wonderfully! My systems are running smoothly.`
            };

            if (userPrompt.includes('who created you') || userPrompt.includes('who made you')) {
                message.reply({ body: fallbackResponses.identity(), mentions: ment });
                return;
            }

            if (userPrompt.includes('what model') || userPrompt.includes('who are you')) {
                message.reply({ body: fallbackResponses.model(), mentions: ment });
                return;
            }

            if (userPrompt.includes('how are you')) {
                message.reply({ body: fallbackResponses.greeting(), mentions: ment });
                return;
            }

            handleApiError(error, message);
        }
    },

    onChat: async function ({ event, message, usersData, api, args }) {
        const { body, senderID } = event;

        if (body && (body.toLowerCase().includes('@proxima') || body.toLowerCase().includes('@ai'))) {
            const cleanMessage = body.replace(/@(proxima|ai)/gi, '').trim();
            if (cleanMessage) {
                const args = cleanMessage.split(' ');
                await this.onStart({ args, message, event, usersData, api });
            }
        }
    },

    onReply: async function ({ message, event, api, usersData }) {
        let name, ment;

        try {
            const id = event.senderID;
            const userData = await usersData.get(id);
            name = userData.name;
            ment = [{ id: id, tag: name }];
            const prompt = event.body;
            const isUserMaster = isMaster(id);

            if (prompt.toLowerCase() === "clear") {
                clearChatHistory(id);
                const prefsFile = path.join(userPreferencesDir, `prefs_${id}.json`);
                if (fs.existsSync(prefsFile)) {
                    fs.unlinkSync(prefsFile);
                }
                const clearMessage = isUserMaster ? 
                    "Master, your conversation history has been cleared!" : 
                    "Chat history cleared! Ready for fresh conversation.";
                message.reply(clearMessage);
                return;
            }

            if (!prompt || prompt.trim() === "") {
                const replyMessage = isUserMaster ? 
                    "Master, I'm here with my capabilities ready to assist you!" :
                    "I'm here and ready to help! Share something with me.";
                message.reply(replyMessage, (err, info) => {
                    if (!err) {
                        global.GoatBot.onReply.set(info.messageID, {
                            commandName: this.config.name,
                            messageID: info.messageID,
                            author: event.senderID
                        });
                    }
                });
                return;
            }

            const chatHistory = loadChatHistory(id);
            const contextualHistory = buildContext(chatHistory);
            const enhancedPrompt = enhancePrompt(prompt, id);
            const finalPrompt = enhancedPrompt + contextualHistory;

            const encodedPrompt = encodeURIComponent(finalPrompt);
            api.setMessageReaction("🕘", event.messageID, () => {}, true);

            const res = await axios.get(`https://proximav2.onrender.com/chat?message=${encodedPrompt}`);

            let result;
            if (typeof res.data === 'string') {
                result = res.data;
            } else if (typeof res.data === 'object') {
                result = res.data.answer || res.data.message || res.data.content || 
                        res.data.response || res.data.reply || res.data.text;

                if (typeof result === 'object' || result === undefined) {
                    if (res.data.choices && res.data.choices[0] && res.data.choices[0].message) {
                        result = res.data.choices[0].message.content;
                    } else if (res.data.candidates && res.data.candidates[0] && res.data.candidates[0].content) {
                        result = res.data.candidates[0].content.parts ? 
                                res.data.candidates[0].content.parts[0].text : 
                                res.data.candidates[0].content;
                    } else {
                        result = JSON.stringify(res.data);
                    }
                }
            } else {
                result = String(res.data);
            }

            if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
                result = isUserMaster ?
                    'Master, I encountered a processing challenge.' :
                    'I encountered a processing challenge. Let me try differently.';
            }

            const formattedResult = formatResponse(result, name);

            api.setMessageReaction("✅", event.messageID, () => {}, true);
            message.reply({
                body: formattedResult,
                mentions: ment,
            }, (err, info) => {
                if (!err) {
                    global.GoatBot.onReply.set(info.messageID, {
                        commandName: this.config.name,
                        messageID: info.messageID,
                        author: event.senderID
                    });
                }
            });

            chatHistory.push({ 
                role: "user", 
                content: prompt, 
                timestamp: Date.now()
            });
            chatHistory.push({ 
                role: "assistant", 
                content: result, 
                timestamp: Date.now()
            });
            saveChatHistory(id, chatHistory);

        } catch (error) {
            console.error("Error:", error.message);
            api.setMessageReaction("⚡", event.messageID, () => {}, true);
            handleApiError(error, message);
        }
    }
};