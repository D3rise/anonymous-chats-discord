import Command from "../struct/Command";
import { Message, MessageEmbed } from "discord.js";
import i18n, { __ } from "i18n";

class HelpCommand extends Command {
  constructor() {
    super("help", {
      aliases: ["help"],
      category: "categories.bot",
      description: "commands.help.desc",
      args: [
        {
          id: "command",
          description: "commands.help.args.command.desc"
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
                where: { discordId: message.guild.id }
              })
            ).prefix
          : this.client.options.defaultPrefix;
      let temp = "";
      let cmds = 0;
      const embed = new MessageEmbed();
      embed.setDescription(__("commands.help.DMprefixDisclaimer"));
      embed.setAuthor(
        __("commands.help.commandsList"),
        this.client.user.displayAvatarURL()
      );

      categories.forEach((category, categoryName) => {
        category.forEach((cmd, name) => {
          cmds++;
          temp += `**${cmd.prefix ? cmd.prefix : prefix}${
            cmd.aliases[0]
          }** - ${__(cmd.description)}\n`;
        });

        embed.addField(__(categoryName), temp);
        temp = "";
      });

      embed.setFooter(
        __(`commands.help.countOfCommands`, { cmds: String(cmds) })
      );
      message.channel.send(embed);
    }
  }
}

export default HelpCommand;
