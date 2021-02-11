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
          type: "number",
        },
        {
          id: "newValue",
          description: "commands.config.args.newValue.desc",
        },
      ],
    });
  }

  async exec(message: Message, args: any) {
    let prefix = this.client.options.defaultPrefix;

    if (message.guild) {
      prefix = this.guild.prefix;
    }

    const avaliableOptions = [
      {
        id: 1,
        db: "gender",
        name: __("commands.config.genderOption"),
      },
      {
        id: 2,
        db: "preferredGender",
        name: __("commands.config.prefferedGender"),
      },
    ];

    const avaliableGenders = [
      {
        id: "male",
        name: __("other.maleGender"),
      },
      {
        id: "female",
        name: __("other.femaleGender"),
      },
      {
        id: "none",
        name: __("other.noneGender"),
      },
    ];

    if (!args.option) {
      let optionsList = "\n";
      avaliableOptions.forEach((opt) => {
        // opt is option
        optionsList +=
          __("commands.config.optionField", {
            name: opt.name,
            id: String(opt.id),
            value: __(this.client.humanizeSetting(this.user.config[opt.db])),
          }) + "\n";
      });

      const optionListEmbed = this.client
        .successEmbed(
          __("commands.config.currentConfig", { list: optionsList })
        )
        .setFooter(
          __("commands.config.howToSetNewValue", {
            prefix,
          })
        );
      return message.channel.send(optionListEmbed);
    }

    const option = avaliableOptions.find(
      (avaliableOption) => avaliableOption.id === args.option
    );
    if (!option) {
      return message.channel.send(
        this.client.errorEmbed(__("errors.theseOptionAreNotAvaliable"))
      );
    }

    const optionDbName = option.db;
    let newValue: any;
    switch (option.id) {
      case 1:
      case 2: {
        newValue = avaliableGenders.find(
          (avaliableGender) =>
            avaliableGender.name.toLowerCase() === args.newValue.toLowerCase()
        );
        if (!newValue)
          return message.channel.send(
            this.client.errorEmbed(__("errors.noSuchGender"))
          );
        break;
      }
    }

    this.user.config[optionDbName] = newValue.id;
    await this.userRepository.save(this.user);

    const embed = this.client.successEmbed(
      __("commands.config.valueHasChanged", {
        option: option.name,
        value: newValue.name,
      })
    );
    return message.channel.send(embed);
  }
}

export default ConfigCommand;
