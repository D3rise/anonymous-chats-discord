import Listener from "../struct/Listener";
import { Message } from "discord.js";
import i18n from "i18n";

class MessageUpdateListener extends Listener {
  urlRegexp: RegExp;

  constructor() {
    super("messageUpdate", {
      emitter: "client",
      event: "messageUpdate"
    });

    this.urlRegexp = new RegExp(
      "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?"
    );
  }

  async exec(oldMessage: Message, newMessage: Message) {
    if (oldMessage.guild || oldMessage.author.bot) return; // if message was sent in the guild or author is bot
    const messageRecord = await this.messageRepository.findOne({
      where: {
        discordId: oldMessage.id
      },
      relations: ["chat"]
    });

    if (messageRecord !== undefined && messageRecord.chat.endedAt === null) {
      const chat = messageRecord.chat;

      if (this.urlRegexp.test(newMessage.content))
        return newMessage.channel.send(
          this.client.errorEmbed(i18n.__("errors.noLinksInTheChat"))
        );

      const recipientId =
        chat.user1Id === oldMessage.author.id ? chat.user2Id : chat.user1Id;

      const recipient = await this.client.users.fetch(recipientId);
      const message = await recipient.dmChannel.messages.fetch(
        messageRecord.sentId
      );

      message.edit(newMessage.content);
    }
  }
}

export default MessageUpdateListener;
