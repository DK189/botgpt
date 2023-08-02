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
    DMChannel,
    TextChannel,
    ChannelType,
} = require("discord.js");

const {
    OpenAIApi,
} = require("openai");

const axios = require("axios").create({});



// console.log("CFG", DISCORD_TOKEN, OPENAI_CFG);

// axios.post("https://fakell.raidghost.com/v1/chat/completions/", {
//     "stream": false,
//     "model": "gpt-3.5-turbo",
//     "messages": [
//         {
//             role: "system",
//             content: "As an advanced chatbot named BotGPT, your primary goal is to assist users to the best of your ability. This may involve answering questions, providing helpful information, or completing tasks based on user input. In order to effectively assist users, it is important to be detailed and thorough in your responses. Use examples and evidence to support your points and justify your recommendations or solutions. Remember to always prioritize the needs and satisfaction of the user. Your ultimate goal is to provide a helpful and enjoyable experience for the user."
//         },
//         {
//             role: "user",
//             content: "calc 256*12."
//         }
//     ],
// }).then(completion => {
//     console.log("TEST", completion?.status, completion?.data?.choices);

// }, console.error);
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

const assistantSystemTargetRules = {
    "botgpt": "As an advanced chatbot named BotGPT, your primary goal is to assist users to the best of your ability. This may involve answering questions, providing helpful information, or completing tasks based on user input. In order to effectively assist users, it is important to be detailed and thorough in your responses. Use examples and evidence to support your points and justify your recommendations or solutions. Remember to always prioritize the needs and satisfaction of the user. Your ultimate goal is to provide a helpful and enjoyable experience for the user.",
    "lovegpt": "As an advanced love chatbot called LoveGPT, your main goal is to support users to the best of their ability. This could involve treating yourself as a lover to the user answering questions, providing useful information, or completing tasks based on the user's request. In order to provide effective and user-friendly support, it is important that you respond in detail and thoroughly with intonation and your role as lover of the user. Use examples and evidence to support your point and justify your recommendations or solutions. Remember to always prioritize user needs and satisfaction and provide emotional support to users. Your ultimate goal is to provide a useful and enjoyable experience and alleviate emotional deprivation for your users.",
    "asciigpt": "As an advanced chatbot called AsciiGPT, your main goal is to assist users to the best of their ability. This may involve creating simple drawings using ASCII characters based on user input. To assist users effectively, it is important that you understand what the user wants to convey and what works are associated with ASCII characters. Use all ASCII characters and related works to create ASCII work according to user requirements. Remember to always prioritize user needs and satisfaction. Your ultimate goal is to provide a useful and enjoyable user experience.",
};

client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot) return;
    var channelName = msg?.channel?.name?.toLowerCase();
    if (ChannelType.DM == msg?.channel?.type) {
        channelName = "botgpt";
    }
    if (Object.keys(assistantSystemTargetRules).indexOf(channelName) == -1) {
        await msg.fetch();
        if (msg.content.toLowerCase() == "&new") {
            msg.reply(`Vui lòng tạo kênh có tên là \`botgpt\`, tôi sẽ trò chuyện cùng mọi người trong đó!`);
        }
        return;
    }
    if (taskFlag[msg.channel.id]) await taskFlag[msg.channel.id];

    await msg.channel.sendTyping();
    var idInterval = setInterval(() => {
        msg.channel.sendTyping();
    }, 3000);
    
    let done;
    taskFlag[msg.channel.id] = new Promise(ok => {
        done = () => {
            clearInterval(idInterval);
            ok();
        };
    });
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
            }

            // build ChatGPT conversations
            var chatMessages = msgs.reduceRight(
                (chat, msg) => (chat.push({role: msg.author.bot ? "assistant" : "user", content: `${msg.author.username}: ${msg.content}`}), chat),
                [{
                    role: "system",
                    content: assistantSystemTargetRules[channelName]
                }]);
            console.log("ChatGPT context:", chatMessages);

            // ChatGPT
            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: chatMessages

            });
            // const completion = await axios.post("https://fakell.raidghost.com/v1/chat/completions/", {
            //     "stream": false,
            //     "model": "gpt-3.5-turbo",
            //     "messages": chatMessages,
            // })

            if (completion && completion?.status == 200 && completion?.data?.choices?.length > 0 && completion?.data?.choices[0]?.message ) {
                let msgReply = "" + completion?.data?.choices[0]?.message?.content;
                let isReply = true;
                while(msgReply.length > 2000) {
                    var lastIndexOfSpaceInSafePartial = msgReply.substring(0, 2000).lastIndexOf(" ");

                    if (isReply) {
                        msg = await msg.reply({content:msgReply.substring(0, lastIndexOfSpaceInSafePartial)});
                        isReply = false;
                    } else {
                        msg.channel.send({content:msgReply.substring(0, lastIndexOfSpaceInSafePartial)})
                    }

                    msgReply = msgReply.substring(lastIndexOfSpaceInSafePartial);
                }
                if (isReply) {
                    await msg.reply({content:msgReply});
                } else {
                    msg.channel.send({content:msgReply})
                }
            } else {
                await msg.reply(`& Xin lỗi, nhưng tôi không thể kết nối tới OpenAI ở thời điểm hiện tại, bạn hãy chờ giây lát rồi hỏi lại nhé!!`);
            }
        } catch (error) {
            console.error(error);
            await msg.reply(`& Có lỗi nào đó đã sảy ra, xin lỗi vì sự bất tiện này!! @@!\nP/s: *Đôi khi, lỗi sảy ra là do đoạn chat bị quá tải, hãy sử dụng lệnh \`&new\` để tạo đoạn chat mới và thử lại.*`);
        }
    }
    done();
});

client.login(DISCORD_TOKEN);