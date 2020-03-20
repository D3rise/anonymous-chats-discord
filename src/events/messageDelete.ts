import Listener from "../struct/Listener";
import { Message } from "discord.js";
import { Message as MessageEntity } from "../entity/Message.entity";
import { Repository, getRepository } from "typeorm";
import { Chat } from "../entity/Chat.entity";

class MessageDeleteListener extends Listener {
  chatRepository: Repository<Chat>;
  messageRepository: Repository<MessageEntity>;

  constructor() {
    super("messageDelete", {
      event: "messageDelete",
      emitter: "client"
    });

    this.messageRepository = getRepository(MessageEntity);
    this.chatRepository = getRepository(Chat);
  }

  async exec(message: Message) {
    if (message.author.bot) return;
    const discord_id = message.author.id;
    const chat = await this.chatRepository.findOne({
      where: [
        { user1_id: discord_id, ended_at: null },
        { user2_id: discord_id, ended_at: null }
      ]
    });
    if (!chat) return;
    const recipientId =
      chat.user1_id === message.author.id ? chat.user2_id : chat.user1_id;
    const recipient = this.client.users.find(user => user.id === recipientId);

    const msgRecord = await this.messageRepository.findOne({
      where: { discord_id: message.id }
    });
    const dmMessage = await recipient.dmChannel.messages.fetch(
      msgRecord.sent_id
    );
    dmMessage.delete();
  }
}

export default MessageDeleteListener;
