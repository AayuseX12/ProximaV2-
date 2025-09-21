const fs = require("fs-extra");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

function checkLangObject(data, langCode) {
    if (typeof data == "string")
        return data;
    if (typeof data == "object" && !Array.isArray(data))
        return data[langCode] || data.en || undefined;
    return undefined;
}

function cropContent(content, max) {
    if (content.length > max) {
        content = content.slice(0, max - 3);
        content = content + "...";
    }
    return content;
}

module.exports = {
    config: {
        name: "help",
        version: "2.0",
        author: "aaayusha",
        countDown: 5,
        role: 0,
        shortDescription: "Auto-detecting help command",
        longDescription: "Automatically detects and lists all available commands",
        category: "reply",
        description: {
            en: "Auto-detecting help command that shows all available commands"
        }
    },
    
    onStart: async function({ message, args, event, threadsData, getLang, role }) {
        const pageNumber = parseInt(args[0]) || 1;
        await this.sendHelpPage(message, pageNumber, event, threadsData, role);
    }, 
    
    onChat: async function(){},
    
    sendHelpPage: async function(message, page = 1, event, threadsData, role) {
        try {
            const langCode = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
            let customLang = {};
            const pathCustomLang = path.normalize(`${process.cwd()}/languages/cmds/${langCode}.js`);
            if (fs.existsSync(pathCustomLang))
                customLang = require(pathCustomLang);

            const { threadID } = event;
            const threadData = await threadsData.get(threadID);
            const prefix = getPrefix(threadID);
            
            const arrayInfo = [];
            const numberOfOnePage = 100;
            
            for (const [name, value] of commands) {
                if (value.config.role > 1 && role < value.config.role)
                    continue;
                    
                if (this.isAdultContent(name, value.config.description, value.config.category))
                    continue;
                    
                let describe = name;
                let description;
                const descriptionCustomLang = customLang[name]?.description;
                if (descriptionCustomLang != undefined)
                    description = checkLangObject(descriptionCustomLang, langCode);
                else if (value.config.description)
                    description = checkLangObject(value.config.description, langCode);
                if (description)
                    describe += `: ${cropContent(description.charAt(0).toUpperCase() + description.slice(1), 50)}`;
                arrayInfo.push({
                    data: describe,
                    priority: value.priority || 0
                });
            }

            arrayInfo.sort((a, b) => a.data.localeCompare(b.data));
            arrayInfo.sort((a, b) => a.priority > b.priority ? -1 : 1);
            
            const { allPage, totalPage } = global.utils.splitPage(arrayInfo, numberOfOnePage);
            
            if (arrayInfo.length === 0) {
                return message.reply(`❌ No commands found! Total commands in bot: ${commands.size}`);
            }
            
            if (page < 1 || page > totalPage) {
                return message.reply(`❌ Invalid page number! Available pages: 1-${totalPage}`);
            }

            const returnArray = allPage[page - 1] || [];
            const startNumber = (page - 1) * numberOfOnePage + 1;
            
            let commandList = '';
            returnArray.forEach((item, index) => {
                const number = (index + startNumber).toString().padStart(3, ' ');
                const commandName = item.data.split(':')[0];
                const name = commandName.charAt(0).toUpperCase() + commandName.slice(1);
                commandList += `|•「${number}」» ${name}\n`;
            });
            
            const helpMessage = `
__________________________
| ❤️ » Bot Commands (Page ${page}/${totalPage})
${commandList.slice(0, -1)}
---------------------------
» Total Commands: ${arrayInfo.length}
» Showing: ${startNumber}-${Math.min(startNumber + returnArray.length - 1, arrayInfo.length)}
» Aayuse's Personal Bot🤍
» Admin Protected🛡️
» Don't Spam Command⚔️
» Be Friendly With Bot🔰
» 10/4 Hrs Active/Day🛠️
            `;
            
            message.reply(helpMessage);
            
        } catch (error) {
            console.log('Error in sendHelpPage:', error);
            message.reply(`❌ Error loading commands: ${error.message}`);
        }
    },
    
    isAdultContent: function(name, description, category) {
        const adultKeywords = [
            'blowjob', 'buttslap', 'sex', 'porn', 'nude', 'nsfw', 
            'adult', 'xxx', 'hentai', 'erotic', 'lesbian', 'gay',
            'dick', 'pussy', 'boobs', 'ass', 'puti', 'cum',
            'orgasm', 'masturbate', 'strip', 'naked', 'bikini',
            'putii', 'proxima', 'aayusha', 'admin', 'ayusha', 'proxi', 'proxu'
        ];
        
        const nameCheck = adultKeywords.some(keyword => 
            name.toLowerCase().includes(keyword)
        );
        
        let descCheck = false;
        if (description) {
            let descText = '';
            if (typeof description === 'string') {
                descText = description;
            } else if (typeof description === 'object') {
                descText = description.en || description.vi || '';
            }
            descCheck = adultKeywords.some(keyword => 
                descText.toLowerCase().includes(keyword)
            );
        }
        
        const categoryCheck = category && ['adult', 'nsfw', '18+'].includes(
            category.toLowerCase()
        );
        
        return nameCheck || descCheck || categoryCheck;
    }
};