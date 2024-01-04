import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js"

require("dotenv").config()

const client = new SapphireClient({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers ]});
client.once('ready', () => {
  console.log("Bot is online");
})
client.login(process.env.TOKEN);

