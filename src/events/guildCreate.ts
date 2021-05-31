import Listener from "../struct/Listener";
import { Guild } from "discord.js";

class GuildCreateListener extends Listener {
  constructor() {
    super("guildCreate", {
      event: "guildCreate",
      emitter: "client",
    });
  }

  async exec(guild: Guild) {
    let guildRecord = await this.guildRepository.findOne({
      where: { discordId: guild.id },
    });
    if (guildRecord) return;

    this.client.logger.debug(`Created guild record for ${guild.id}`);

    guildRecord = this.guildRepository.create({
      discordId: guild.id,
    });
    this.guildRepository.save(guildRecord);
  }
}

export default GuildCreateListener;
