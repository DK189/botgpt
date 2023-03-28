// https://discord.com/oauth2/authorize?scope=bot&permissions=8&client_id=<DISCORD_APPLICATION_ID>

const {
    Configuration,
} = require("openai");

module.exports = {
    DISCORD_TOKEN: process.env.DISCORD_BOT_TOKEN,
    OPENAI_CFG: new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
};