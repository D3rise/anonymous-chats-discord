import Command from "../struct/Command";
import { Message } from "discord.js";
import i18n, { __ } from "i18n";

class PingCommand extends Command {
  constructor() {
    super("ping", {
      aliases: ["ping"],
      category: "categories.bot",
      description: "commands.ping.desc",
    });
  }

  async exec(message: Message) {
    const sent = await message.reply(__("commands.ping.oneMoment"));
    const timeDiff = sent.createdAt.getTime() - message.createdAt.getTime();
    return message.channel.send(
      __(`commands.ping.timeForMessage`, {
        timeDiff: String(timeDiff),
      }) +
        "\n" +
        __(`commands.ping.timeForAPI`, {
          ping: String(Math.round(this.client.ws.ping)),
        })
    );
  }
}

export default PingCommand;
