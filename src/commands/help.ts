import Command from "../struct/Command";
import ArgumentOptions from "../struct/ArgumentOptions";
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
          description: "commands.help.args.command.desc",
        },
      ],
    });
  }

  async exec(message: Message, args: any) {
    const categories = this.client.commandHandler.categories;
    const prefix =
      message.guild !== null
        ? (
            await this.guildRepository.findOne({
              where: { discordId: message.guild.id },
            })
          ).prefix
        : this.client.options.defaultPrefix;

    const embed = new MessageEmbed();
    embed.setDescription(
      __("commands.help.DMprefixDisclaimer") +
        "\n\n" +
        __("commands.help.botGuide", {
          prefix,
          defaultPrefix: this.client.options.defaultPrefix,
        })
    );

    if (!args.command) {
      embed.setAuthor(
        __("commands.help.commandsList"),
        this.client.user.displayAvatarURL()
      );

      let temp = "";
      let cmds = 0;
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
        __(`commands.help.countOfCommands`, { cmds: String(cmds) }) +
          " | " +
          __(`commands.help.howToGetHelpOfCommand`, { prefix })
      );
      message.channel.send(embed);
    } else {
      let command: Command;
      let categoryName: string;
      categories.forEach((category, name) => {
        category.forEach((cmd) => {
          if (!cmd.aliases.includes(args.command)) return;
          command = new Command(cmd.id, Object(cmd));
          categoryName = name;
        });
      });
      if (!command)
        return message.channel.send(
          this.client.errorEmbed(__("errors.noSuchCommand"))
        );
      embed.setTitle(
        __("commands.help.commandName") + " " + command.aliases[0]
      );

      if (command.description !== null) {
        embed.addField(
          `> ${__("commands.help.description")}`,
          __(command.description),
          true
        );
      }
      if (command.categoryName !== null) {
        embed.addField(
          `> ${__("commands.help.category")}`,
          __(categoryName),
          true
        );
      }
      embed.addField(
        `> ${__("commands.help.canBeUsedOnGuild")}`,
        command.channel === "dm" ? __("other.no") : __("other.yes"),
        true
      );

      let commandArgs: string = "";
      if (command.args && command.args.length !== 0) {
        commandArgs += "**" + __("commands.help.argsFormat") + "**" + "```md\n";
        command.args.forEach((arg, index) => {
          commandArgs += `${index + 1}. ${arg.id}${
            arg.required ? "*" : ""
          } - ${__(arg.description)}\n`;
        });
        commandArgs += "```";
        embed.addField(`> ${__("commands.help.args")}`, commandArgs);
      }

      return message.channel.send(embed);
    }
  }
}

export default HelpCommand;
