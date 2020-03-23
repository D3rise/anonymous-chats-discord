import Command from "../struct/Command";
import { Message, User } from "discord.js";
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
      const user: User = this.client.users.find(usr => usr.id === chat.user2Id);
      user.dmChannel.stopTyping(true);
      user.send(embed);
    } else {
      const user: User = this.client.users.find(usr => usr.id === chat.user1Id);
      user.dmChannel.stopTyping();
      user.send(embed);
    }

    chat.endedAt = new Date();
    await this.chatRepository.save(chat);

    this.client.updateChatCount();
    return message.channel.send(
      this.client.successEmbed(__("commands.stop.chatIsOver"))
    );
  }
}

export default StopCommand;
