import Command from "../struct/Command";
import { MessageEmbed, Message } from "discord.js";
import i18n, { __ } from "i18n";

class InfoCommand extends Command {
  constructor() {
    super("info", {
      aliases: ["stats", "info"],
      category: "categories.bot",
      description: "commands.info.desc"
    });
  }

  async exec(message: Message) {
    const dialogueCount = await this.chatRepository.find({ ended_at: null });

    return message.channel.send(
      new MessageEmbed()
        .setAuthor(
          __("commands.info.stats"),
          this.client.user.displayAvatarURL()
        )
        .addField(__("commands.info.users"), this.client.users.size, true)
        .addField(__("commands.info.guilds"), this.client.guilds.size, true)
        .addField(
          __("commands.info.dialogues"),
          await this.chatRepository.count(),
          true
        )
        .addField(
          __("commands.info.dialoguesInThisMoment"),
          dialogueCount.length,
          true
        )
        .addField(
          __("commands.info.interlucutorsCount"),
          dialogueCount.length * 2,
          true
        )
        .addField(__("commands.info.shardId"), this.client.shard.ids[0], true)
        .setDescription(
          __(`commands.info.inviteMeToYourServer`, {
            botId: this.client.user.id
          })
        )
    );
  }

  get users() {
    let users = 0;
    this.client.guilds.each(g => (users += g.memberCount));
    return users;
  }
}

export default InfoCommand;
