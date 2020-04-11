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
      channel: "dm",
    });
  }

  async exec(message: Message) {
    const chat = await this.chatRepository.findOne({
      where: [
        {
          user1Id: message.author.id,
          endedAt: null,
        },
        {
          user2Id: message.author.id,
          endedAt: null,
        },
      ],
    });

    if (!chat)
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
      );

    const embed = this.client.successEmbed(
      __("commands.stop.broHasCancelledTheChat") +
        "\n\n" +
        __("other.voteMessage", { botId: this.client.user.id })
    );
    if (chat.user1Id === message.author.id) {
      const user: User = await this.client.users.fetch(chat.user2Id);
      user.dmChannel.stopTyping(true);
      user.send(embed);
    } else {
      const user: User = await this.client.users.fetch(chat.user1Id);
      user.dmChannel.stopTyping();
      user.send(embed);
    }

    chat.endedAt = new Date();
    await this.chatRepository.save(chat);

    return message.channel.send(
      this.client.successEmbed(
        __("commands.stop.chatIsOver") +
          "\n\n" +
          __("other.voteMessage", { botId: this.client.user.id })
      )
    );
  }
}

export default StopCommand;
