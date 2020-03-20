import Client from "./struct/Client";
import config from "./config.json";
import "reflect-metadata";

const bot = new Client({
  ownerID: config.ownerId,
  defaultPrefix: config.defaultPrefix,
  contactServerInvite: config.contactServerInvite
});
bot.login(process.env.TOKEN);

export default bot;
