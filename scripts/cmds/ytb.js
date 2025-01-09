const axios = require("axios");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs-extra");
const ytsr = require("ytsr"); // Import ytsr for searching YouTube

const { getStreamFromURL, downloadFile, formatNumber } = global.utils;

// Helper function to get the stream and size of a file
async function getStreamAndSize(url, path = "") {
    const response = await axios({
        method: "GET",
        url,
        responseType: "stream",
        headers: {
            'Range': 'bytes=0-'
        }
    });
    if (path) response.data.path = path;
    const totalLength = response.headers["content-length"];
    return {
        stream: response.data,
        size: totalLength
    };
}

// Function to get video info from YouTube
async function getVideoInfo(id) {
    try {
        id = id.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)/);
        id = id[2] !== undefined ? id[2].split(/[^0-9a-z_\-]/i)[0] : id[0];

        const { data: html } = await axios.get(`https://youtu.be/${id}?hl=en`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36'
            }
        });

        const json = JSON.parse(html.match(/var ytInitialPlayerResponse = (.*?});/)?.[1] || "{}");
        const json2 = JSON.parse(html.match(/var ytInitialData = (.*?});/)?.[1] || "{}");

        const { title, lengthSeconds, viewCount, videoId, thumbnail, author } = json.videoDetails;

        let getChapters;
        try {
            getChapters = json2.playerOverlays.playerOverlayRenderer.decoratedPlayerBarRenderer.decoratedPlayerBarRenderer.playerBar.multiMarkersPlayerBarRenderer.markersMap.find(x => x.key == "DESCRIPTION_CHAPTERS" && x.value.chapters).value.chapters;
        } catch (e) {
            getChapters = [];
        }

        const owner = json2.contents.twoColumnWatchNextResults.results.results.contents.find(x => x.videoSecondaryInfoRenderer).videoSecondaryInfoRenderer.owner;

        return {
            videoId,
            title,
            lengthSeconds: parseInt(lengthSeconds, 10),
            viewCount: parseInt(viewCount, 10),
            uploadDate: json.microformat?.playerMicroformatRenderer?.uploadDate || "Unknown",
            likes: json.videoDetails.likes || "Unavailable",
            thumbnail,
            chapters: getChapters,
            author: owner,
            video_url: `https://youtu.be/${videoId}`
        };
    } catch (error) {
        console.error("Error fetching video info:", error.message);
        throw new Error("Unable to fetch video information. Please try again.");
    }
}

// Search function using ytsr (YouTube Search Results)
async function search(query) {
    try {
        const searchResults = await ytsr(query, { limit: 6 }); // Limit to 6 results
        return searchResults.items.filter(item => item.type === 'video'); // Only return videos
    } catch (error) {
        console.error("Error searching for videos:", error.message);
        throw new Error("Error during YouTube search.");
    }
}

module.exports = {
    config: {
        name: "ytb",
        version: "1.16",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: {
            vi: "Tải video, audio hoặc xem thông tin video trên YouTube",
            en: "Download video, audio or view video information on YouTube"
        },
        category: "media",
        guide: {
            vi: "{pn} [video|-v] [<tên video>|<link video>]: dùng để tải video từ youtube."
                + "\n   {pn} [audio|-a] [<tên video>|<link video>]: dùng để tải audio từ youtube"
                + "\n   {pn} [info|-i] [<tên video>|<link video>]: dùng để xem thông tin video từ youtube"
                + "\n   Ví dụ:"
                + "\n    {pn} -v Fallen Kingdom"
                + "\n    {pn} -a Fallen Kingdom"
                + "\n    {pn} -i Fallen Kingdom",
            en: "{pn} [video|-v] [<video name>|<video link>]: use to download video from youtube."
                + "\n   {pn} [audio|-a] [<video name>|<video link>]: use to download audio from youtube"
                + "\n   {pn} [info|-i] [<video name>|<video link>]: use to view video information from youtube"
                + "\n   Example:"
                + "\n    {pn} -v Fallen Kingdom"
                + "\n    {pn} -a Fallen Kingdom"
                + "\n    {pn} -i Fallen Kingdom"
        }
    },

    onStart: async function ({ args, message, event, commandName, getLang }) {
        let type;
        switch (args[0]) {
            case "-v":
            case "video":
                type = "video";
                break;
            case "-a":
            case "-s":
            case "audio":
            case "sing":
                type = "audio";
                break;
            case "-i":
            case "info":
                type = "info";
                break;
            default:
                return message.SyntaxError();
        }

        const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
        const urlYtb = checkurl.test(args[1]);

        if (urlYtb) {
            const infoVideo = await getVideoInfo(args[1]);
            handle({ type, infoVideo, message, getLang });
            return;
        }

        let keyWord = args.slice(1).join(" ");
        keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;

        let result;
        try {
            result = await search(keyWord);
        } catch (err) {
            return message.reply(getLang("error", err.message));
        }
        if (result.length == 0)
            return message.reply(getLang("noResult", keyWord));

        let msg = "";
        let i = 1;
        const thumbnails = [];
        const arrayID = [];

        for (const info of result) {
            thumbnails.push(getStreamFromURL(info.thumbnail));
            msg += `${i++}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel.name}\n\n`;
        }

        message.reply({
            body: getLang("choose", msg),
            attachment: await Promise.all(thumbnails)
        }, (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
                commandName,
                messageID: info.messageID,
                author: event.senderID,
                arrayID,
                result,
                type
            });
        });
    },

    onReply: async ({ event, api, Reply, message, getLang }) => {
        const { result, type } = Reply;
        const choice = event.body;
        if (!isNaN(choice) && choice <= 6) {
            const infoChoice = result[choice - 1];
            const idvideo = infoChoice.id;
            const infoVideo = await getVideoInfo(idvideo);
            api.unsendMessage(Reply.messageID);
            await handle({ type, infoVideo, message, getLang });
        }
        else
            api.unsendMessage(Reply.messageID);
    }
};

async function handle({ type, infoVideo, message, getLang }) {
    const { title, videoId } = infoVideo;

    if (type == "video") {
        const MAX_SIZE = 83 * 1024 * 1024; // 83MB (max size of video that can be sent on fb)
        const msgSend = message.reply(getLang("downloading", getLang("video"), title));
        const { formats } = await ytdl.getInfo(videoId);
        const getFormat = formats
            .filter(f => f.hasVideo && f.hasAudio && f.quality == 'tiny' && f.audioBitrate == 128)
            .sort((a, b) => b.contentLength - a.contentLength)
            .find(f => f.contentLength || 0 < MAX_SIZE);
        if (!getFormat)
            return message.reply(getLang("noVideo"));

        const getStream = await getStreamAndSize(getFormat.url, `${videoId}.mp4`);
        if (getStream.size > MAX_SIZE)
            return message.reply(getLang("noVideo"));

        const savePath = __dirname + `/tmp/${videoId}_${Date.now()}.mp4`;
        const writeStrean = fs.createWriteStream(savePath);
        const startTime = Date.now();
        getStream.stream.pipe(writeStrean);
        const contentLength = getStream.size;
        let downloaded = 0;
        let count = 0;

        getStream.stream.on("data", (chunk) => {
            downloaded += chunk.length;
            count++;
            if (count == 5) {
                const endTime = Date.now();
                const speed = downloaded / (endTime - startTime) * 1000;
                const timeLeft = (contentLength / downloaded * (endTime - startTime)) / 1000;
                const percent = (downloaded / contentLength * 100).toFixed(2);
                message.reply(getLang("downloadingProgress", percent, formatNumber(timeLeft), formatNumber(speed)));
            }
        });

        writeStrean.on("finish", async () => {
            const data = fs.readFileSync(savePath);
            await message.reply({
                body: getLang("downloadSuccess"),
                attachment: data
            });
            fs.removeSync(savePath);
        });
    }
}