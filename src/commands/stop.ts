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
    const chat = this.chat;

    if (!chat)
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
      );

    const embed = this.client.successEmbed(
      __("commands.stop.broHasCancelledTheChat")
    );
    if (chat.user1Id === message.author.id) {
      this.client.users.find(user => user.id === chat.user2Id).send(embed);
    } else {
      this.client.users.find(user => user.id === chat.user1Id).send(embed);
    }

    chat.endedAt = new Date();
    await this.chatRepository.save(chat);

    return message.channel.send(
      this.client.successEmbed(__("commands.stop.chatIsOver"))
    );
  }
}

export default StopCommand;
