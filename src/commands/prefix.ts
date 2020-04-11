import Command from "../struct/Command";
import { Message } from "discord.js";
import i18n, { __ } from "i18n";

class PrefixCommand extends Command {
  constructor() {
    super("prefix", {
      aliases: ["prefix"],
      category: "categories.config",
      description: "commands.prefix.desc",
      args: [
        {
          id: "newPrefix",
          description: "commands.prefix.args.newPrefix.desc",
        },
      ],
      channel: "guild",
    });
  }

  async exec(message: Message, args: any) {
    const guildRecord = await this.guildRepository.findOne({
      discordId: message.guild.id,
    });

    if (args.newPrefix) {
      if (!message.member.hasPermission("MANAGE_GUILD")) {
        return message.channel.send(
          this.client.errorEmbed(__("errors.insufficientPermissions"))
        );
      }

      // Set new prefix
      guildRecord.prefix = args.newPrefix;
      await this.guildRepository.save(guildRecord);

      return message.channel.send(
        this.client.successEmbed(
          __(`commands.prefix.newPrefixMessage`, {
            newPrefix: guildRecord.prefix,
          })
        )
      );
    }

    message.channel.send(
      this.client.embed(
        __(`Текущий префикс на этом сервере: \`{{currentPrefix}}\``, {
          currentPrefix: guildRecord.prefix,
        })
      )
    );
  }
}

export default PrefixCommand;
