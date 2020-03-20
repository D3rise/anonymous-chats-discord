import Command from "../struct/Command";
import { MessageEmbed, Message } from "discord.js";

class InfoCommand extends Command {
  constructor() {
    super("info", {
      aliases: ["инфо", "информация", "статистика", "статы", "stats"],
      category: "Бот",
      description: "Получить информацию о боте"
    });
  }

  async exec(message: Message) {
    const dialogueCount = await this.chatRepository.find({ ended_at: null });

    return message.channel.send(
      new MessageEmbed()
        .setAuthor("Статистика", this.client.user.displayAvatarURL())
        .addField("> Пользователи", this.client.users.size, true)
        .addField("> Сервера", this.client.guilds.size, true)
        .addField("> Диалоги", await this.chatRepository.count(), true)
        .addField("> Диалоги в данный момент", dialogueCount.length, true)
        .addField(
          "> Собеседники в данный момент",
          dialogueCount.length / 2,
          true
        )
        .addField("> Текущий шард", this.client.shard.ids[0], true)
        .setDescription(
          `[Пригласить меня на свой сервер](https://discordapp.com/api/oauth2/authorize?client_id=${this.client.user.id}&permissions=388160&scope=bot)`
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
