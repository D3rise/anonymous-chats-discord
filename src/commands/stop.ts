import Command from "../struct/Command";
import { Message } from "discord.js";
import { __ } from "i18n";

class StopCommand extends Command {
  constructor() {
    super("stop", {
      aliases: [__("стоп"), __("stop")],
      description: __("Выйти из чата"),
      category: __("Чат"),
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
        this.client.errorEmbed(__("Вы не находитесь в чате!"))
      );

    const embed = this.client.successEmbed(__("Собеседник покинул чат."));
    if (chat.user1_id === message.author.id) {
      this.client.users.find(user => user.id === chat.user2_id).send(embed);
    } else {
      this.client.users.find(user => user.id === chat.user1_id).send(embed);
    }

    chat.ended_at = new Date();
    await this.chatRepository.save(chat);

    return message.channel.send(
      this.client.successEmbed(__("Чат был окончен."))
    );
  }
}

export default StopCommand;
