import Listener from "../struct/Listener";
import { User, Channel } from "discord.js";

class TypingStartListener extends Listener {
  constructor() {
    super("typingStart", {
      event: "typingStart",
      emitter: "client",
    });
  }

  async exec(channel: Channel, user: User) {
    if (channel.type !== "dm") return;

    const chat = await this.chatRepository.findOne({
      where: [
        {
          user1Id: user.id,
          endedAt: null,
        },
        {
          user2Id: user.id,
          endedAt: null,
        },
      ],
    });
    if (!chat) return;

    const recipientId = user.id === chat.user1Id ? chat.user2Id : chat.user1Id;
    const recipient = await this.client.users.fetch(recipientId);
    const dmChannel = recipient.dmChannel;
    dmChannel.startTyping();

    setTimeout(dmChannel.stopTyping.bind(this, [true]), 5000);
  }
}

export default TypingStartListener;
