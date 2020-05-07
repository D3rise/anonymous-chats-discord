import Command from "../struct/Command";
import { Message } from "discord.js";
import { __ } from "i18n";

class ConfigGuildCommand extends Command {
  constructor() {
    super("config-server", {
      aliases: ["config-server"],
      description: "commands.configGuild.desc",
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
    if (!message.guild) {
      return message.channel.send(
        this.client.errorEmbed(__("errors.commandCanBeUsedOnlyInGuild"))
      );
    }

    const prefix = this.guild.prefix;
    const avaliableOptions = [
      {
        id: 1,
        db: "guildSearch",
        name: __("commands.configGuild.guildSearchOptionName"),
      },
    ];

    const avaliableBoolean = [
      {
        id: false,
        name: __("other.no"),
      },
      {
        id: true,
        name: __("other.yes"),
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
            value: __(this.client.humanizeSetting(this.guild.config[opt.db])),
          }) + "\n";
      });

      const optionListEmbed = this.client
        .successEmbed(
          __("commands.config.currentConfig", { list: optionsList })
        )
        .setFooter(
          __("commands.configGuild.howToSetNewValue", {
            prefix,
          })
        );
      return message.channel.send(optionListEmbed);
    }

    if (!message.member.hasPermission("MANAGE_GUILD")) {
      return message.channel.send(
        this.client.errorEmbed(__("errors.insufficientPermissions"))
      );
    }

    const option = avaliableOptions.find(
      (avaliableOption) => avaliableOption.id === args.option
    );
    if (!option) {
      return message.channel.send(
        this.client.errorEmbed(__("errors.theseOptionAreNotAvaliable"))
      );
    }
    const optionDb = option.db;
    let newValue: any;

    switch (option.id) {
      case 1: {
        const errorEmbed = this.client.errorEmbed(
          __("errors.noSuchGuildSearchBoolean")
        );
        if (!args.newValue) {
          return message.channel.send(errorEmbed);
        }

        newValue = avaliableBoolean.find(
          (aBool) => aBool.name.toLowerCase() === args.newValue.toLowerCase()
        ); // aBool is avaliableBoolean

        if (!newValue) {
          return message.channel.send(errorEmbed);
        }
      }
    }

    this.guild.config[optionDb] = newValue.id;
    await this.guildRepository.save(this.guild);

    const embed = this.client.successEmbed(
      __("commands.config.valueHasChanged", {
        option: option.name,
        value: newValue.name,
      })
    );
    return message.channel.send(embed);
  }
}

export default ConfigGuildCommand;
