import Listener from "../struct/Listener";
import { Message } from "discord.js";

class MessageDeleteListener extends Listener {
  constructor() {
    super("messageDelete", {
      event: "messageDelete",
      emitter: "client",
    });
  }

  async exec(message: Message) {
    if (message.author.bot) return;
    if (message.channel.type !== "dm") return;
    const discordId = message.author.id;
    const chat = await this.chatRepository.findOne({
      where: [
        { user1Id: discordId, ended_at: null },
        { user2Id: discordId, ended_at: null },
      ],
    });
    if (!chat) return;
    const recipientId =
      chat.user1Id === discordId ? chat.user2Id : chat.user1Id;
    const recipient = this.client.users.find((user) => user.id === recipientId);

    const msgRecord = await this.messageRepository.findOne({
      where: { discordId: message.id },
    });
    if (!msgRecord) return;
    const dmMessage = await recipient.dmChannel.messages.fetch(
      msgRecord.sentId
    );
    dmMessage.delete();
  }
}

export default MessageDeleteListener;
