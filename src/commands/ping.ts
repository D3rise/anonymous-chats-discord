import Command from "../struct/Command";
import { Message } from "discord.js";
import i18n, { __ } from "i18n";

class PingCommand extends Command {
  constructor() {
    super("ping", {
      aliases: [__("ping")],
      category: __("Бот"),
      description: __("Получить информацию о пинге бота")
    });
  }

  async exec(message: Message) {
    const sent = await message.reply(__("секундочку..."));
    const timeDiff = sent.createdAt.getTime() - message.createdAt.getTime();
    return message.channel.send(
      __(
        `🔂 **Время на отправку сообщения**: {{timeDiff}} ms\n` +
          `💟 **Скорость ответа от Discord API**: {{ping}} ms`,
        {
          timeDiff: String(timeDiff),
          ping: String(Math.round(this.client.ws.ping))
        }
      )
    );
  }
}

export default PingCommand;
