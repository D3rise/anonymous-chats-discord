import Client from "./struct/Client";
import config from "./config.json";
import AutoPoster from 'topgg-autoposter'
import "reflect-metadata";

const bot = new Client({
  ownerID: config.ownerId,
  defaultPrefix: config.defaultPrefix,
});
bot.login(process.env.TOKEN);

if(process.env.DBL_TOKEN) {
  const ap = AutoPoster(process.env.DBL_TOKEN, bot)
  ap.on('posted', () => bot.logger.info("Successfully posted stats to DBL!"))
}

export default bot;
