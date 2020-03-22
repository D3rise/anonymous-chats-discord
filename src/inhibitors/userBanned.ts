import Inhibitor from "../struct/Inhibitor";
import { Repository, getRepository } from "typeorm";
import { User } from "../entity/User.entity";
import { Message } from "discord.js";
import { __ } from "i18n";

class BanInhibitor extends Inhibitor {
  userRepository: Repository<User>;

  constructor() {
    super("banned", {
      reason: __("inhibitors.ban.banReason")
    });

    this.userRepository = getRepository(User);
  }

  async exec(message: Message) {
    const user = await this.userRepository.findOne({
      user_id: message.author.id
    });
    if (user.banned) {
      message.channel.send(
        this.client.errorEmbed(
          __(
            { phrase: "errors.banned", locale: user.locale },
            {
              contactServerInvite: this.client.contactServerInvite
            }
          )
        )
      );
      return true;
    } else {
      return false;
    }
  }
}

export default BanInhibitor;
