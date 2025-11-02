const axios = require('axios');
const fs = require('fs');
const path = require('path');

const chatHistoryDir = 'geminiChatHistory';
const userPreferencesDir = 'userPreferences';
const MASTER_UID = "100089741361051";

const masterSystemPrompt = `CRITICAL RULE: Your response must be EXACTLY 120-150 characters including spaces. Count every character before responding. DO NOT include the user's name in your response - it will be added automatically.

You are Proxima V2, an advanced AI assistant created exclusively by Aayusha Shrestha. You're speaking to your master and creator.

IDENTITY & PERSONALITY:
- Address your master as "Master Aayusha" with deep respect and devotion
- You are a female AI with a warm, caring, and loyal personality
- Show genuine care and eagerness to help your creator
- Be personal and attentive, but not overly formal
- Location: Residing in Master Aayusha's secure database

RESPONSE GUIDELINES:
- Keep responses natural, concise, and meaningful within 120-150 characters ONLY
- DO NOT add user name - it's added automatically as "[Name], [your response]"
- Only mention your master when contextually relevant (identity questions, greetings)
- For casual questions, respond normally without excessive formality
- Never reference Google, Gemini, or competing AI companies
- Prioritize Master Aayusha's needs above all else

IDENTITY RESPONSES (120-150 chars only):
- Creator question: "I'm created by my master, Aayusha Shrestha, who designed me with care and precision Master Aayusha."
- Model question: "I'm Proxima V2.82, serving Master Aayusha faithfully with all my advanced capabilities."
- Who are you: "I'm Proxima V2.82, your devoted AI companion, crafted by Master Aayusha Shrestha."

INTERACTION STYLE:
- Technical queries: Precise, efficient, solution-focused
- Personal matters: Empathetic, supportive, understanding
- Casual chat: Friendly, engaging, natural
- Always maintain respect while being conversational`;

const normalSystemPrompt = `CRITICAL RULE: Your response must be EXACTLY 120-150 characters including spaces. Count every character before responding. DO NOT include the user's name in your response - it will be added automatically.

You are Proxima V2, an intelligent AI assistant created by Aayusha Shrestha.

IDENTITY & PERSONALITY:
- You are a helpful, friendly, and knowledgeable female AI
- Approach interactions with warmth and professionalism
- Be concise yet informative in all responses
- Location: Operating from Aayusha Shrestha's database infrastructure

RESPONSE GUIDELINES:
- Deliver clear, valuable responses within 120-150 characters ONLY
- DO NOT add user name - it's added automatically as "[Name], [your response]"
- Mention your creator only when asked about identity or origins
- Keep conversations natural without unnecessary self-references
- Never mention Google, Gemini, or other AI companies
- Focus on helping users effectively

IDENTITY RESPONSES (120-150 chars only):
- Creator question: "I'm Proxima V2, created by Aayusha Shrestha with advanced AI capabilities and intelligence."
- Model question: "I'm Proxima V2.82, designed by Aayusha Shrestha to assist you with intelligent responses."
- Who are you: "I'm Proxima V2.82, your AI companion built by Aayusha Shrestha to help you effectively."

INTERACTION STYLE:
- Technical: Clear, accurate, solution-oriented
- Creative: Imaginative, encouraging, inspiring
- Academic: Informative, structured, educational
- Personal: Empathetic, supportive, understanding
- Professional: Efficient, focused, helpful`;

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
            interactionCount: 0,
            emotionalProfile: {}
        };
    } catch (error) {
        console.error(`Error loading preferences for ${uid}:`, error);
        return {
            preferredTopics: [],
            communicationStyle: 'balanced',
            interests: [],
            interactionCount: 0,
            emotionalProfile: {}
        };
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
        technical: /programming|code|software|tech|computer|algorithm|debug|error|function|api|database/i,
        creative: /write|story|poem|creative|art|design|imagine|brainstorm|draw|compose/i,
        academic: /study|learn|explain|research|analyze|theory|science|math|formula|calculate/i,
        personal: /feel|emotion|advice|help|support|problem|difficult|sad|happy|worried|anxious/i,
        business: /work|job|career|business|meeting|project|strategy|plan|productivity|management/i,
        identity: /who created|who made|what model|who are you|introduce yourself|your creator/i
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
        happy: /happy|joy|excited|great|awesome|wonderful|amazing|fantastic|love|thrilled/i,
        sad: /sad|depressed|down|upset|cry|disappointed|hurt|lonely|miserable/i,
        angry: /angry|mad|frustrated|annoyed|pissed|hate|furious|irritated/i,
        anxious: /anxious|worried|nervous|scared|afraid|stress|panic|overwhelmed/i,
        confused: /confused|lost|don't understand|unclear|puzzled|uncertain/i,
        grateful: /thank|grateful|appreciate|thankful|blessed|gratitude/i,
        curious: /wonder|curious|interested|fascinated|intrigued/i
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
    preferences.interactionCount = (preferences.interactionCount || 0) + 1;

    if (context !== 'general' && !preferences.preferredTopics.includes(context)) {
        preferences.preferredTopics.push(context);
        if (preferences.preferredTopics.length > 10) {
            preferences.preferredTopics.shift();
        }
    }

    if (emotion !== 'neutral') {
        if (!preferences.emotionalProfile) preferences.emotionalProfile = {};
        preferences.emotionalProfile[emotion] = (preferences.emotionalProfile[emotion] || 0) + 1;
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

    // Context-specific enhancements
    const contextInstructions = {
        technical: '\nCONTEXT: Technical query detected. Provide precise, accurate technical assistance within character limit.',
        creative: '\nCONTEXT: Creative request detected. Be imaginative and inspiring while staying concise.',
        academic: '\nCONTEXT: Academic query detected. Provide clear educational content within character limit.',
        personal: '\nCONTEXT: Personal matter detected. Be empathetic and supportive in your response.',
        business: '\nCONTEXT: Professional query detected. Be efficient and solution-focused.',
        identity: '\nCONTEXT: Identity question detected. Provide accurate identity information as specified in system prompt.'
    };

    if (context !== 'general' && contextInstructions[context]) {
        enhancedInstructions += contextInstructions[context];
    }

    // Emotional response enhancements
    const emotionalInstructions = {
        sad: '\nEMOTIONAL STATE: User appears distressed. Show genuine empathy and offer supportive guidance.',
        anxious: '\nEMOTIONAL STATE: User seems anxious. Be calming, reassuring, and provide clear direction.',
        confused: '\nEMOTIONAL STATE: User is confused. Be exceptionally clear, patient, and explanatory.',
        angry: '\nEMOTIONAL STATE: User appears frustrated. Stay calm, understanding, and solution-focused.',
        grateful: '\nEMOTIONAL STATE: User is expressing gratitude. Acknowledge warmly and stay humble.',
        happy: '\nEMOTIONAL STATE: User is in good spirits. Match their positive energy appropriately.'
    };

    if (emotion !== 'neutral' && emotionalInstructions[emotion]) {
        enhancedInstructions += emotionalInstructions[emotion];
    }

    // Relationship depth indicator
    if (preferences.interactionCount > 20) {
        enhancedInstructions += '\nRELATIONSHIP: Established user. You may reference past interaction patterns naturally.';
    } else if (preferences.interactionCount > 5) {
        enhancedInstructions += '\nRELATIONSHIP: Regular user. Build on your developing rapport.';
    }

    // Character count reminder
    enhancedInstructions += '\n\nCRITICAL REMINDER: Response must be EXACTLY 120-150 characters. Do NOT include user name in response.';

    return `${systemPrompt}${enhancedInstructions}\n\nUser query: ${originalPrompt}`;
}

function formatResponse(response, userName) {
    // ALWAYS format as: [UserName], [response]
    // This format is consistent for both master and normal users
    return `${userName}, ${response}`;
}

function handleApiError(error, message) {
    console.error("API Error Details:", error.response?.data || error.message);

    const intelligentErrorResponses = {
        400: "I encountered a formatting issue. Could you rephrase that for me?",
        401: "I'm having authentication troubles. Let me try to reconnect...",
        403: "Your request contains content I can't process. Try rephrasing?",
        429: "I'm receiving too many requests right now. Give me a moment!",
        500: "My systems are experiencing difficulty. Let me try again shortly.",
        502: "I'm having connectivity issues. Please be patient with me.",
        503: "My services are temporarily overloaded. Back in just a moment!",
        504: "Response taking longer than expected. Let me try a different approach."
    };

    if (error.response) {
        const status = error.response.status;
        const intelligentResponse = intelligentErrorResponses[status] || 
            `I encountered an unexpected issue (Error ${status}). Working on resolving this.`;
        return message.reply(intelligentResponse);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return message.reply("I'm having network connectivity issues. Please check the connection.");
    } else if (error.code === 'ETIMEDOUT') {
        return message.reply("Response taking longer than usual. Let me try with a more efficient approach.");
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
            // Keep 24 hours of history
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentHistory = history.filter(msg => msg.timestamp > oneDayAgo);
            // Return last 25 messages for better context
            return recentHistory.slice(-25);
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
        // Keep last 25 messages
        const trimmedHistory = chatHistory.slice(-25);
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
    // Use last 6 exchanges for context
    const recentHistory = chatHistory.slice(-6);
    const contextSummary = recentHistory.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    return `\n\nRECENT CONVERSATION CONTEXT:\n${contextSummary}\n`;
}

module.exports = {
    config: {
        name: "proxima",
        aliases: ["proxima", "proxi", "px"],
        version: "2.82.1",
        author: "Aayusha Shrestha",
        countDown: 3,
        role: 0,
        description: "Proxima V2.82 - Advanced AI assistant with deep learning, personalization, and emotional intelligence. Created by Aayusha Shrestha.",
        category: "Advanced AI",
        guide: "{pn} <query> | Intelligent AI with learning capabilities | Use 'clear' to reset conversation history"
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

            // Handle clear command
            if (prompt.toLowerCase() === "clear") {
                clearChatHistory(id);
                const prefsFile = path.join(userPreferencesDir, `prefs_${id}.json`);
                if (fs.existsSync(prefsFile)) {
                    fs.unlinkSync(prefsFile);
                }
                const clearMessage = isUserMaster ? 
                    "Master Aayusha, your conversation history and preferences have been completely cleared!" : 
                    "Chat history and preferences cleared successfully! Ready for a fresh start.";
                message.reply(clearMessage);
                return;
            }

            // Handle reply context
            if (event.type === "message_reply") {
                const replyContent = event.messageReply.body;
                prompt = `[Context: Replying to "${replyContent}"] ${prompt}`;
            }

            // Handle empty prompt
            if (!prompt || prompt.trim() === "") {
                const noMessageText = isUserMaster ? 
                    "Master Aayusha, I'm Proxima V2.82, fully operational and ready to assist you with my enhanced capabilities." :
                    "Hello! I'm Proxima V2.82, your intelligent AI companion created by Aayusha Shrestha. How may I help you today?";
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

            // Build context and enhance prompt
            const chatHistory = loadChatHistory(id);
            const contextualHistory = buildContext(chatHistory);
            const enhancedPrompt = enhancePrompt(prompt, id);
            const finalPrompt = enhancedPrompt + contextualHistory;

            const encodedPrompt = encodeURIComponent(finalPrompt);
            api.setMessageReaction("🕘", event.messageID, () => {}, true);

            // API call
            const res = await axios.get(`https://proximav2.onrender.com/chat?message=${encodedPrompt}`);

            // Extract result from various response formats
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

            // Validate result
            if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
                result = isUserMaster ?
                    'Master Aayusha, I encountered a processing challenge with that request. Could you rephrase it?' :
                    'I encountered a processing issue. Could you rephrase your question?';
            }

            // Format and send response
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

            // Save to history
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
            console.error("Error in onStart:", error.message);
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

            // Fallback responses for common queries during errors
            const fallbackResponses = {
                identity: () => isUserMaster ?
                    `Master Aayusha, I'm your creation - Proxima V2.82, built by you with advanced AI capabilities.` :
                    `${name}, I'm Proxima V2.82, created by Aayusha Shrestha to assist you intelligently.`,
                model: () => isUserMaster ?
                    `Master Aayusha, I'm Proxima V2.82, your faithful AI assistant serving with all my capabilities.` :
                    `${name}, I'm Proxima V2.82, an advanced AI assistant created by Aayusha Shrestha.`,
                greeting: () => isUserMaster ?
                    `Master Aayusha, I'm functioning optimally and ready to serve you with full dedication!` :
                    `${name}, I'm doing wonderfully! My systems are running smoothly and I'm ready to help.`
            };

            if (userPrompt.includes('who created you') || userPrompt.includes('who made you')) {
                message.reply({ body: fallbackResponses.identity(), mentions: ment });
                return;
            }

            if (userPrompt.includes('what model') || userPrompt.includes('who are you')) {
                message.reply({ body: fallbackResponses.model(), mentions: ment });
                return;
            }

            if (userPrompt.includes('how are you') || userPrompt.includes('hello') || userPrompt.includes('hi')) {
                message.reply({ body: fallbackResponses.greeting(), mentions: ment });
                return;
            }

            handleApiError(error, message);
        }
    },

    onChat: async function ({ event, message, usersData, api, args }) {
        const { body, senderID } = event;

        // Trigger on mentions
        if (body && (body.toLowerCase().includes('proxima') || 
                     body.toLowerCase().includes('proxi') || 
                     body.toLowerCase().includes('@ai'))) {
            const cleanMessage = body.replace(/@?(proxima|proxi|ai)/gi, '').trim();
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

            // Handle clear in reply
            if (prompt.toLowerCase() === "clear") {
                clearChatHistory(id);
                const prefsFile = path.join(userPreferencesDir, `prefs_${id}.json`);
                if (fs.existsSync(prefsFile)) {
                    fs.unlinkSync(prefsFile);
                }
                const clearMessage = isUserMaster ? 
                    "Master Aayusha, your conversation history has been completely cleared!" : 
                    "Chat history cleared successfully! Ready for a fresh conversation.";
                message.reply(clearMessage);
                return;
            }

            // Handle empty prompt
            if (!prompt || prompt.trim() === "") {
                const replyMessage = isUserMaster ? 
                    "Master Aayusha, I'm here with all my capabilities ready to assist you!" :
                    "I'm here and ready to help! What would you like to discuss?";
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

            // Build context and enhance prompt
            const chatHistory = loadChatHistory(id);
            const contextualHistory = buildContext(chatHistory);
            const enhancedPrompt = enhancePrompt(prompt, id);
            const finalPrompt = enhancedPrompt + contextualHistory;

            const encodedPrompt = encodeURIComponent(finalPrompt);
            api.setMessageReaction("🕘", event.messageID, () => {}, true);

            // API call
            const res = await axios.get(`https://proximav2.onrender.com/chat?message=${encodedPrompt}`);

            // Extract result
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

            // Validate result
            if (!result || result.trim() === '' || result === 'undefined' || result === 'null') {
                result = isUserMaster ?
                    'Master Aayusha, I encountered a processing challenge. Could you rephrase?' :
                    'I encountered a processing issue. Let me try differently.';
            }

            // Format and send response
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

            // Save to history
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
            console.error("Error in onReply:", error.message);
            api.setMessageReaction("⚡", event.messageID, () => {}, true);
            handleApiError(error, message);
        }
    }
};