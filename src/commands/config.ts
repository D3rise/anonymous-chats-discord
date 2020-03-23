import { Message } from "discord.js";
import Command from "../struct/Command";
import { __ } from "i18n";

class ConfigCommand extends Command {
  constructor() {
    super("config", {
      aliases: ["config"],
      description: "commands.config.desc",
      category: "categories.config",
      args: [
        {
          id: "option",
          description: "commands.config.args.option.desc",
          type: "number"
        },
        {
          id: "newValue",
          description: "commands.config.args.newValue.desc"
        }
      ]
    });
  }

  async exec(message: Message, args: any) {
    const avaliableOptions = [
      {
        id: 1,
        db: "gender",
        name: __("commands.config.genderOption")
      },
      {
        id: 2,
        db: "prefferedGender",
        name: __("commands.config.prefferedGender")
      },
      {
        id: 3,
        db: "guild",
        name: __("commands.config.guild")
      }
    ];

    if (!args.option) {
      let optionsList = "\n";
      avaliableOptions.forEach(option => {
        optionsList += __("commands.config.optionField", {
          name: option.name,
          id: String(option.id)
        });
      });
      const embed = this.client
        .successEmbed(
          __("commands.config.listOfAvaliableOptions", { list: optionsList })
        )
        .setFooter(
          __("commands.config.howToSetNewValue", {
            prefix: this.guild.prefix || this.client.options.defaultPrefix
          })
        );
      return message.channel.send(embed);
    }

    if (args.option) {
      const option = avaliableOptions.find(
        avaliableOption => avaliableOption.id === args.option
      );
      const optionDbName = option.db;
      if (!option) {
        return message.channel.send(
          this.client.errorEmbed(__("errors.theseOptionAreNotAvaliable"))
        );
      }

      this.user.config[optionDbName];
    }
  }
}

export default ConfigCommand;
