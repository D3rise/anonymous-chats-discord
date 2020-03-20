import Command from "../struct/Command";
import { Message } from "discord.js";

class PingCommand extends Command {
  constructor() {
    super("ping", {
      aliases: ["ping"],
      category: "Бот",
      description: "Получить информацию о пинге бота"
    });
  }

  async exec(message: Message) {
    const sent = await message.reply("секундочку...");
    const timeDiff = sent.createdAt.getTime() - message.createdAt.getTime();
    return message.channel.send(
      `🔂 **Время на отправку сообщения**: ${timeDiff} ms\n` +
        `💟 **Скорость ответа от Discord API**: ${Math.round(
          this.client.ws.ping
        )} ms`
    );
  }
}

export default PingCommand;
