import Command from "../struct/Command";
import { Message } from "discord.js";
import { __ } from "i18n";

class StopSearchCommand extends Command {
  constructor() {
    super("stop-search", {
      aliases: ["stop-search"],
      category: "categories.chat",
      prefix: "!",
      channel: "dm",
      description: "commands.stopSearch.desc",
    });
  }

  async exec(message: Message, args: any) {
    if (!this.chat) {
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
      );
    }

    const commandHandler = this.client.commandHandler;
    const commands = [
      commandHandler.findCommand("stop"),
      commandHandler.findCommand("search"),
    ];

    commands.forEach((command) => {
      commandHandler.runCommand(message, command, args);
    });
  }
}

export default StopSearchCommand;
