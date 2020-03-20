import Command from "../struct/Command";
import { Message } from "discord.js";

class PrefixCommand extends Command {
  constructor() {
    super("prefix", {
      aliases: ["prefix"],
      category: "Бот",
      description: "Изменить префикс бота на вашем сервере",
      args: [
        {
          id: "newPrefix",
          description: "Новый префикс"
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
          this.client.errorEmbed("Недостаточно разрешений!")
        );
      }

      // Set new prefix
      guildRecord.prefix = args.newPrefix;
      await this.guildRepository.save(guildRecord);

      return message.channel.send(
        this.client.successEmbed(
          `Новый префикс бота на этом сервере: \`${guildRecord.prefix}\``
        )
      );
    }

    message.channel.send(
      this.client.embed(
        `Текущий префикс на этом сервере: \`${guildRecord.prefix}\``
      )
    );
  }
}

export default PrefixCommand;
