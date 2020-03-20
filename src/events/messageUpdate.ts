import Listener from "../struct/Listener";
import { getRepository, Repository } from "typeorm";
import { Message } from "discord.js";
import { Message as MessageEntity } from "../entity/Message.entity";

class MessageUpdateListener extends Listener {
  messageRepository: Repository<MessageEntity>;
  urlRegexp: RegExp;

  constructor() {
    super("messageUpdate", {
      emitter: "client",
      event: "messageUpdate"
    });

    this.messageRepository = getRepository(MessageEntity);
    this.urlRegexp = new RegExp(
      "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?"
    );
  }

  async exec(oldMessage: Message, newMessage: Message) {
    if (oldMessage.guild || oldMessage.author.bot) return; // if message was sent in the guild or author is bot
    let messageRecord = await this.messageRepository.findOne({
      where: {
        discord_id: oldMessage.id
      },
      relations: ["chat"]
    });

    if (messageRecord !== undefined && messageRecord.chat.ended_at === null) {
      let chat = messageRecord.chat;

      let recipientId =
        chat.user1_id === oldMessage.author.id ? chat.user2_id : chat.user1_id;

      const recipient = await this.client.users.fetch(recipientId);
      const message = await recipient.dmChannel.messages.fetch(
        messageRecord.sent_id
      );

      message.edit(newMessage.content);
    }
  }
}

export default MessageUpdateListener;
