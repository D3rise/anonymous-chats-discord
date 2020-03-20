import Listener from "../struct/Listener";
import { Guild } from "discord.js";
import { Repository, getRepository } from "typeorm";
import { Guild as GuildEntity } from "../entity/Guild.entity";

class GuildCreateListener extends Listener {
  guildRepository: Repository<GuildEntity>;

  constructor() {
    super("guildCreate", {
      event: "guildCreate",
      emitter: "client"
    });

    this.guildRepository = getRepository(GuildEntity);
  }

  async exec(guild: Guild) {
    let guildRecord = await this.guildRepository.findOne({
      where: { discord_id: guild.id }
    });
    if (guildRecord) return;

    guildRecord = this.guildRepository.create({
      discord_id: guild.id
    });
    this.guildRepository.save(guildRecord);
  }
}

export default GuildCreateListener;
