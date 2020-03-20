import Command from "../struct/Command";
import moment from "moment-timezone";
import momentDurationFormat from "moment-duration-format";
import { Message, MessageEmbed, MessageEmbedOptions } from "discord.js";
momentDurationFormat(require("moment-timezone"));
import { __ } from "i18n";

class SearchCommand extends Command {
  constructor() {
    super("поиск", {
      aliases: [__("поиск"), __("search")],
      category: __("Чат"),
      description: __("Начать поиск собеседника")
    });
  }

  async exec(message: Message) {
    const handleMessageError = () =>
      message.channel.send(
        this.client.errorEmbed(
          __("К сожалению, бот не может отправить вам сообщение.\n") +
            __("Проверьте свои настройки конфиденциальности.")
        )
      );

    if (message.guild !== null)
      message.delete({
        reason: __("Команда поиска собеседника")
      });

    const chat = await this.chatRepository.findOne({
      where: [
        { user1_id: message.author.id, ended_at: null },
        { user2_id: message.author.id, ended_at: null }
      ]
    });
    if (chat)
      return message.author
        .send(this.client.errorEmbed(__("Вы уже находитесь в чате!")))
        .catch(handleMessageError);

    let userSearchRecord = await this.searchRepository.findOne({
      user_id: message.author.id
    });

    if (userSearchRecord) {
      const diff = moment().diff(moment(userSearchRecord.started_at));

      await this.searchRepository.delete(userSearchRecord);
      return message.author
        .send(
          this.client.errorEmbed(
            __(
              `Поиск собеседника был отменен.\nВремя ожидания: {{waitingTime}}`,
              {
                waitingTime: moment
                  .duration(diff, "milliseconds")
                  .format(__("HH часов, mm минут, ss секунд"))
              }
            )
          )
        )
        .catch(handleMessageError);
    }

    userSearchRecord = this.searchRepository.create({
      user_id: message.author.id,
      started_at: new Date()
    });
    await this.searchRepository.save(userSearchRecord);

    message.author
      .send(
        this.client.successEmbed(
          "Поиск собеседника был начат.\n" +
            `На данный момент собеседника ищут: ${(await this.searchRepository.count()) -
              1} человек(а) не включая вас`
        )
      )
      .catch(handleMessageError);

    this.client.emit("searchStarted", message.author, userSearchRecord);
  }
}

export default SearchCommand;
