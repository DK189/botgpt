const {
    DISCORD_TOKEN,
    OPENAI_CFG
} = require("./config.js");

const {
    Client,
    GatewayIntentBits,
    Partials,
    Events,
    REST,
    Routes,
} = require("discord.js");

const {
    OpenAIApi,
} = require("openai");

// console.log("CFG", DISCORD_TOKEN, OPENAI_CFG);
// return;

const openai = new OpenAIApi(OPENAI_CFG);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: Object.values(Partials).filter(x => typeof x === "number")
});

client.on(Events.ClientReady, async (cli) => {
    console.log(`Sẵn sàng rồi ${cli.user.tag}!`);
    // cli.guilds.cache.
    for (let [guildId, guild] of cli.guilds.cache) {
        console.log(`\tChúng ta đang có mặt trong ${guild.name}!`);
    }
    console.log(`Dùng link sau để thêm BotGPT vào server nhé!!\n\thttps://discord.com/oauth2/authorize?scope=bot&permissions=8&client_id=${cli.user.id}`);
    console.log();
});
client.on(Events.GuildCreate, async (guild) => {
    console.log(`Đã vào máy chủ ${guild.name}.`);
});
client.on(Events.GuildDelete, async (guild) => {
    console.log(`Èo, vừa bị kick khỏi ${guild.name}.`);
});

var taskFlag = {};

client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot) return;
    if (msg?.channel?.name?.toLowerCase() != "botgpt") {
        await msg.fetch();
        if (msg.content.toLowerCase() == "&new") {
            msg.reply(`Vui lòng tạo kênh có tên là \`botgpt\`, tôi sẽ trò chuyện cùng mọi người trong đó!`);
        }
        return;
    }
    if (taskFlag[msg.channel.id]) await taskFlag[msg.channel.id];
    let done;
    taskFlag[msg.channel.id] = new Promise(ok => {
        done = ok;
    });

    await msg.channel.sendTyping();
    await msg.fetch();

    let content = msg.content;

    if (content.startsWith("&")) {
        console.log("<command>", content.toLowerCase());
        switch (content.toLowerCase()) {
            case "&new":
                msg.reply(`Bắt đầu đoạn chat mới!`);
                break;
            default:
                msg.reply(`<UNKNOWN-COMMAND>`);
                break;
        }
        console.log("Command-ed.");
    } else {
        try {
            var msgs = [];

            globalLoop: while (true) {
                let oldMsgs = await msg.channel.messages.fetch({
                    limit: 50,
                    before: msgs.length > 0 ? msgs[msgs.length - 1].id : undefined
                });
                if (Array.from(oldMsgs).length == 0) break globalLoop;
                for (let [_, _msg] of oldMsgs) {
                    if (_msg.content.toLowerCase() == "&new") {
                        break globalLoop;
                    }
                    if (!_msg.author.bot || _msg.author.id == client.user.id) {
                        // console.log(`${_msg.author.username} (${_msg.createdAt}): ${_msg.content}`);
                        if (!_msg.content.startsWith("&")) {
                            msgs.push(_msg);
                        }
                    }
                }
                await msg.channel.sendTyping();
            }

            // build ChatGPT conversations
            var chatMessages = msgs.reduceRight((chat, msg) => (chat.push({role: msg.author.bot ? "system" : "user", content: msg.content}), chat),[]);
            console.log("ChatGPT context:", chatMessages);
            await msg.channel.sendTyping();

            // ChatGPT
            let idInterval = setInterval(() => {
                msg.channel.sendTyping();
            }, 1000);
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: chatMessages

            });
            clearInterval(idInterval);
            if (completion && completion?.status == 200 && completion?.data?.choices?.length > 0 && completion?.data?.choices[0]?.message ) {
                await msg.reply(completion?.data?.choices[0]?.message);
            } else {
                await msg.reply(`& Xin lỗi, nhưng tôi không thể kết nối tới OpenAI ở thời điểm hiện tại, bạn hãy chờ giây lát rồi hỏi lại nhé!!`);
            }
        } catch (error) {
            console.error(error);
            await msg.reply(`& Có lỗi nào đó đã sảy ra, xin lỗi vì sự bất tiện này!! @@!`);
        }
    }
    done();
});

client.login(DISCORD_TOKEN);