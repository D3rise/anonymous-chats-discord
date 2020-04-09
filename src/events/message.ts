import { Message, GuildChannel } from "discord.js";
import Listener from "../struct/Listener";
import { Chat } from "../entity/Chat.entity";
import { Message as MessageEntity } from "../entity/Message.entity";
import { Repository, getRepository } from "typeorm";
import { User } from "../entity/User.entity";
import config from "../config.json";
import i18n from "i18n";

class MessageListener extends Listener {
  urlRegexp: RegExp;

  constructor() {
    super("message", {
      emitter: "client",
      event: "message",
    });

    this.urlRegexp = new RegExp(
      "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?"
    );
  }

  async exec(message: Message) {
    if (message.author.bot) return;
    if (message.guild !== null) return;

    if (
      message.content.startsWith("!") ||
      message.content.startsWith(this.client.options.defaultPrefix)
    )
      return;

    const chat = await this.chatRepository.findOne({
      where: [
        { user1Id: message.author.id, endedAt: null },
        { user2Id: message.author.id, endedAt: null },
      ],
      relations: ["messages"],
    });

    if (!chat || chat.endedAt !== null) return;

    if (this.urlRegexp.test(message.content))
      return message.channel.send(
        this.client.errorEmbed(
          i18n.__({ phrase: "errors.noLinksInTheChat", locale: chat.locale })
        )
      );

    const recipientId =
      message.author.id === chat.user1Id ? chat.user2Id : chat.user1Id;

    const recipient = await this.client.users.fetch(recipientId);
    if (!recipient) {
      return this.handleUserNotAvaliable(message, chat);
    }
    recipient.dmChannel.stopTyping(true);

    recipient
      .send(message.content, { files: message.attachments.array() })
      .then(async (msg) => {
        const user = await this.userRepository.findOne({
          where: {
            userId: message.author.id,
          },
          relations: ["messages"],
        });

        const attachments = message.attachments.array();
        const attachmentUris: string[] = [];
        if (attachments.length !== 0) {
          attachments.forEach((attachment) => {
            attachmentUris.push(attachment.proxyURL);
          });
        }

        chat.lastMessageDate = new Date();
        const messageRecord = await this.messageRepository.create({
          discordAuthorId: message.author.id,
          discordId: message.id,
          sentId: msg.id,
          content: message.content,
          attachmentUris,
          createdAt: new Date(),
        });

        user.messages.push(messageRecord);
        chat.messages.push(messageRecord);

        await this.messageRepository.save(messageRecord);
        await this.chatRepository.save(chat);
        await this.userRepository.save(user);
      })
      .catch((e: Error) => {
        if (e.message === "Cannot send messages to this user") {
          return this.handleUserNotAvaliable(message, chat);
        } else {
          this.client.logger.error(e);
          return message.channel.send(
            this.client.errorEmbed(
              i18n.__(
                { phrase: `errors.unexpectedError`, locale: chat.locale },
                { name: e.name }
              )
            )
          );
        }
      });
    await this.client.updateMessageCount();
  }

  async handleUserNotAvaliable(message: Message, chat: Chat) {
    chat.endedAt = new Date();
    this.chatRepository.save(chat);
    return message.channel.send(
      this.client.errorEmbed(
        i18n.__({ phrase: "errors.userNotAvaliable", locale: chat.locale })
      )
    );
  }
}

export default MessageListener;
