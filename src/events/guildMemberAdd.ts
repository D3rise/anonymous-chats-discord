import Listener from "../struct/Listener";
import { User } from "../entity/User.entity";
import { GuildMember } from "discord.js";
import { getRepository } from "typeorm";

class GuildMemberAddListener extends Listener {
  constructor() {
    super("guildMemberAdd", {
      event: "guildMemberAdd",
      emitter: "client",
    });

    this.userRepository = getRepository(User);
  }

  async exec(member: GuildMember) {
    if (member.user.bot) return;
    this.userRepository.findOne({ userId: member.id }).then((user) => {
      if (!user) {
        const userRecord = this.userRepository.create({
          userId: member.id,
        });
        this.userRepository.save(userRecord);
      }
    });

    this.client.logger.debug(`Created user record for ${member.user.id}`);
  }
}

export default GuildMemberAddListener;
