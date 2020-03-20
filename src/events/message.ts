import { Message, GuildChannel } from "discord.js";
import Listener from "../struct/Listener";
import { Chat } from "../entity/Chat.entity";
import { Message as MessageEntity } from "../entity/Message.entity";
import { Repository, getRepository } from "typeorm";
import { User } from "../entity/User.entity";
import config from "../config.json";

class MessageListener extends Listener {
  chatRepository: Repository<Chat>;
  messageRepository: Repository<MessageEntity>;
  userRepository: Repository<User>;
  urlRegexp: RegExp;

  constructor() {
    super("message", {
      emitter: "client",
      event: "message"
    });

    this.chatRepository = getRepository(Chat);
    this.messageRepository = getRepository(MessageEntity);
    this.userRepository = getRepository(User);
    this.urlRegexp = new RegExp(
      "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?"
    );
  }

  async exec(message: Message) {
    if (message.author.bot) return;
    if (message.guild !== null) return;
    if (message.content.startsWith("!")) return;

    const chat = await this.chatRepository.findOne({
      where: [
        { user1_id: message.author.id, ended_at: null },
        { user2_id: message.author.id, ended_at: null }
      ],
      relations: ["messages"]
    });
    if (!chat || chat.ended_at !== null) return;

    if (this.urlRegexp.test(message.content))
      return message.channel.send(
        this.client.errorEmbed("В чате нельзя отправлять ссылки!")
      );

    const recipientId =
      message.author.id === chat.user1_id ? chat.user2_id : chat.user1_id;

    const recipient = await this.client.users.fetch(recipientId);
    recipient
      .send(message.content, { files: message.attachments.array() })
      .then(async msg => {
        const user = await this.userRepository.findOne({
          where: {
            user_id: message.author.id
          },
          relations: ["messages"]
        });

        chat.last_message_date = new Date();
        let messageRecord = await this.messageRepository.create({
          discord_author_id: message.author.id,
          discord_id: message.id,
          sent_id: msg.id,
          content: message.content
        });

        const attachments = message.attachments.array();
        if (attachments.length !== 0) {
          attachments.forEach(attachment => {
            messageRecord.attachmentUris.push(attachment.proxyURL);
          });
        }

        user.messages.push(messageRecord);
        chat.messages.push(messageRecord);

        await this.messageRepository.save(messageRecord);
        await this.chatRepository.save(chat);
        await this.userRepository.save(user);
      });
  }
}

export default MessageListener;
