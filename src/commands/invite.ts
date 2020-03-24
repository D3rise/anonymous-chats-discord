import Command from "../struct/Command";
import { Message } from "discord.js";
import { __ } from "i18n";
import path from "path";

class InviteCommand extends Command {
  constructor() {
    super("invite", {
      aliases: ["invite", "inv"],
      description: "commands.invite.desc",
      category: "categories.bot"
    });
  }

  async exec(message: Message) {
    const embed = this.client.embed({
      title: __("commands.invite.embedTitle"),
      description: __("commands.invite.embedDescription", {
        botId: this.client.user.id,
        devSite: this.client.options.devSite,
        patreonId: this.client.options.patreonId,
        supportServer: this.client.options.contactServerInvite
      }),
      author: {
        icon_url: this.client.user.displayAvatarURL(),
        name: __("other.anonymousChat")
      },
      footer: {
        text: __("commands.invite.embedFooter", {
          version: require(path.join(__dirname, "..", "..", "package.json"))
            .version
        })
      },
      color: "#2e3136"
    });
    return message.channel.send(embed);
  }
}

export default InviteCommand;
