import Command from "../struct/Command";
import { Message } from "discord.js";
import { __ } from "i18n";

class StopCommand extends Command {
  constructor() {
    super("stop", {
      aliases: ["stop"],
      description: "commands.stop.desc",
      category: "categories.chat",
      prefix: "!",
      channel: "dm"
    });
  }

  async exec(message: Message) {
    const chat = await this.chatRepository.findOne({
      where: [
        { user1_id: message.author.id, ended_at: null },
        { user2_id: message.author.id, ended_at: null }
      ]
    });

    if (!chat)
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
      );

    const embed = this.client.successEmbed(
      __("commands.stop.broHasCancelledTheChat")
    );
    if (chat.user1_id === message.author.id) {
      this.client.users.find(user => user.id === chat.user2_id).send(embed);
    } else {
      this.client.users.find(user => user.id === chat.user1_id).send(embed);
    }

    chat.ended_at = new Date();
    await this.chatRepository.save(chat);

    return message.channel.send(
      this.client.successEmbed(__("commands.stop.chatIsOver"))
    );
  }
}

export default StopCommand;
