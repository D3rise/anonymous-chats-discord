import Command from "../struct/Command";
import { Message } from "discord.js";
import i18n, { __ } from "i18n";

class PrefixCommand extends Command {
  constructor() {
    super("prefix", {
      aliases: [__("prefix")],
      category: __("Бот"),
      description: __("Изменить префикс бота на вашем сервере"),
      args: [
        {
          id: "newPrefix",
          description: __("Новый префикс")
        }
      ],
      channel: "guild"
    });
  }

  async exec(message: Message, args: any) {
    const guildRecord = await this.guildRepository.findOne({
      discord_id: message.guild.id
    });

    if (args.newPrefix) {
      if (!message.member.hasPermission("MANAGE_GUILD")) {
        return message.channel.send(
          this.client.errorEmbed(__("Недостаточно разрешений!"))
        );
      }

      // Set new prefix
      guildRecord.prefix = args.newPrefix;
      await this.guildRepository.save(guildRecord);

      return message.channel.send(
        this.client.successEmbed(
          __(`Новый префикс бота на этом сервере: \`{{newPrefix}}\``, {
            newPrefix: guildRecord.prefix
          })
        )
      );
    }

    message.channel.send(
      this.client.embed(
        __(`Текущий префикс на этом сервере: \`{{newPrefix}}\``, {
          newPrefix: guildRecord.prefix
        })
      )
    );
  }
}

export default PrefixCommand;
