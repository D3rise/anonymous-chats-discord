import Listener from "../struct/Listener";
import { User } from "../entity/User.entity";
import { GuildMember } from "discord.js";
import { Repository, getRepository } from "typeorm";

class GuildMemberAddListener extends Listener {
  userRepository: Repository<User>;

  constructor() {
    super("guildMemberAdd", {
      event: "guildMemberAdd",
      emitter: "client"
    });

    this.userRepository = getRepository(User);
  }

  async exec(member: GuildMember) {
    if (member.user.bot) return;
    this.userRepository.findOne({ user_id: member.id }).then(user => {
      if (!user) {
        const userRecord = this.userRepository.create({
          user_id: member.id
        });
        this.userRepository.save(userRecord);
      }
    });
  }
}
