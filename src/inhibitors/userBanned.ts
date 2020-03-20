import Inhibitor from "../struct/Inhibitor";
import { Repository, getRepository } from "typeorm";
import { User } from "../entity/User.entity";
import { Message } from "discord.js";

class BanInhibitor extends Inhibitor {
  userRepository: Repository<User>;

  constructor() {
    super("banned", {
      reason: "бан"
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
          "К сожалению, вы были заблокированы.\n" +
            "Чтобы подать заявку на разблокировку аккаунта, " +
            `напишите администрации на [этом](${this.client.contactServerInvite}) ` +
            "сервере, почему по вашему мнению блокировка безосновательна."
        )
      );
      return true;
    } else {
      return false;
    }
  }
}

export default BanInhibitor;
