import Listener from "../struct/Listener";
import { Guild } from "discord.js";
import { Repository, getRepository } from "typeorm";
import { Guild as GuildEntity } from "../entity/Guild.entity";
import { User } from "../entity/User.entity";

class GuildCreateListener extends Listener {
  guildRepository: Repository<GuildEntity>;
  userRepository: Repository<User>;

  constructor() {
    super("guildCreate", {
      event: "guildCreate",
      emitter: "client"
    });

    this.guildRepository = getRepository(GuildEntity);
    this.userRepository = getRepository(User);
  }

  async exec(guild: Guild) {
    let guildRecord = await this.guildRepository.findOne({
      where: { discord_id: guild.id }
    });
    if (guildRecord) return;

    guild.members.each(member => {
      if (member.user.bot) return;
      this.userRepository.findOne({ user_id: member.id }).then(user => {
        if (!user) {
          const userRecord = this.userRepository.create({
            user_id: member.id
          });
          this.userRepository.save(userRecord);
        }
      });
    });

    guildRecord = this.guildRepository.create({
      discord_id: guild.id
    });
    this.guildRepository.save(guildRecord);
  }
}

export default GuildCreateListener;
