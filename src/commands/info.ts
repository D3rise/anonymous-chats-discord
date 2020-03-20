import Command from "../struct/Command";
import { MessageEmbed, Message } from "discord.js";
import i18n, { __ } from "i18n";

class InfoCommand extends Command {
  constructor() {
    super("info", {
      aliases: [
        __("инфо"),
        __("информация"),
        __("статистика"),
        __("статы"),
        __("stats")
      ],
      category: __("Бот"),
      description: __("Получить информацию о боте")
    });
  }

  async exec(message: Message) {
    const dialogueCount = await this.chatRepository.find({ ended_at: null });

    return message.channel.send(
      new MessageEmbed()
        .setAuthor(__("Статистика"), this.client.user.displayAvatarURL())
        .addField(__("> Пользователи"), this.client.users.size, true)
        .addField(__("> Сервера"), this.client.guilds.size, true)
        .addField(__("> Диалоги"), await this.chatRepository.count(), true)
        .addField(__("> Диалоги в данный момент"), dialogueCount.length, true)
        .addField(
          __("> Собеседники в данный момент"),
          dialogueCount.length / 2,
          true
        )
        .addField(__("> Текущий шард"), this.client.shard.ids[0], true)
        .setDescription(
          __(
            `[Пригласить меня на свой сервер](https://discordapp.com/api/oauth2/authorize?client_id={{botId}}&permissions=388160&scope=bot)`,
            { botId: this.client.user.id }
          )
        )
    );
  }

  get users() {
    let users = 0;
    this.client.guilds.each(g => (users += g.memberCount));
    return users;
  }
}

export default InfoCommand;
