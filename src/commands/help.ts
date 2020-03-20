import Command from "../struct/Command";
import { Message, MessageEmbed } from "discord.js";

class HelpCommand extends Command {
  constructor() {
    super("помощь", {
      aliases: ["помощь", "команды", "h", "help", "commands"],
      category: "Бот",
      description: "Получить список команд бота",
      args: [
        {
          id: "command",
          description: "Команда, по которой нужно узнать помощь"
        }
      ]
    });
  }

  async exec(message: Message, args: any) {
    if (!args.command) {
      const categories = this.client.commandHandler.categories;
      const prefix =
        message.guild !== null
          ? (
              await this.guildRepository.findOne({
                where: { discord_id: message.guild.id }
              })
            ).prefix
          : this.client.options.defaultPrefix;
      let temp = "";
      let cmds = 0;
      let embed = new MessageEmbed();
      embed.setDescription(
        "Команды, которые начинаются с префикса `!` могут быть использованы только в личных сообщениях."
      );
      embed.setAuthor("Список команд", this.client.user.displayAvatarURL());

      categories.forEach((category, categoryName) => {
        category.forEach((cmd, name) => {
          cmds++;
          temp += `**${cmd.prefix ? cmd.prefix : prefix}${cmd.aliases[0]}** - ${
            cmd.description
          }\n`;
        });

        embed.addField(categoryName, temp);
        temp = "";
      });

      embed.setFooter(`Количество команд: ${cmds}`);
      message.channel.send(embed);
    }
  }
}

export default HelpCommand;
