import Command from "../struct/Command";
import { Message, MessageEmbed } from "discord.js";
import i18n, { __ } from "i18n";

class HelpCommand extends Command {
  constructor() {
    super("помощь", {
      aliases: [__("помощь"), __("команды"), __("help"), __("commands")],
      category: __("Бот"),
      description: __("Получить список команд бота"),
      args: [
        {
          id: "command",
          description: __("Команда, по которой нужно узнать помощь")
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
        __(
          "Команды, которые начинаются с префикса `!` могут быть использованы только в личных сообщениях."
        )
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

      embed.setFooter(
        __(`Количество команд: {{cmds}}`, { cmds: String(cmds) })
      );
      message.channel.send(embed);
    }
  }
}

export default HelpCommand;
