import Command from "../struct/Command";
import { MessageEmbed, Message } from "discord.js";
import i18n, { __ } from "i18n";
import path from "path";

class InfoCommand extends Command {
  constructor() {
    super("info", {
      aliases: ["info", "stats"],
      category: "categories.bot",
      description: "commands.info.desc",
    });
  }

  async exec(message: Message) {
    const dialogueCount = await this.chatRepository.find({ endedAt: null });
    const packageFile = require(path.join(
      __dirname,
      "..",
      "..",
      "package.json"
    ));

    return message.channel.send(
      this.client
        .embed({
          title: __("commands.invite.embedTitle"),
          description:
            __("commands.invite.embedDescription", {
              botId: this.client.user.id,
              devSite: this.client.options.devSite,
              patreonId: this.client.options.patreonId,
              supportServer: this.client.options.contactServerInvite,
            }) +
            "\n\n" +
            __("other.voteMessage", { botId: this.client.user.id }),
          author: {
            icon_url: this.client.user.displayAvatarURL(),
            name: __("other.anonymousChat"),
          },
          footer: {
            text: __("commands.invite.embedFooter", {
              version: packageFile.version,
            }),
          },
          color: "#2e3136",
        })
        .addField(__("commands.info.users"), this.client.users.cache.size, true)
        .addField(__("commands.info.guilds"), this.client.guilds.cache.size, true)
        .addField(__("commands.info.channels"), this.client.channels.cache.size, true)
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
        .addField(
          __("commands.info.shardId"),
          this.client.shard.ids[0] + 1,
          true
        )
        .addField(
          __("commands.info.owner"),
          this.client.users.cache.find((u) => u.id === this.client.ownerID).tag,
          true
        )
        .addField(__("commands.info.nodejs"), process.version, true)
        .addField(
          __("commands.info.discordjs"),
          packageFile.dependencies["discord.js"],
          true
        )
        .addField(__("commands.info.license"), packageFile.license, true)
        .addField(
          __("commands.info.repository"),
          `[Github](${packageFile.repository.url})`,
          true
        )
    );
  }

  get users() {
    let users = 0;
    this.client.guilds.cache.each((g) => (users += g.memberCount));
    return users;
  }
}

export default InfoCommand;
