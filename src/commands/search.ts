import Command from "../struct/Command";
import moment from "moment-timezone";
import momentDurationFormat from "moment-duration-format";
import { Message, MessageEmbed, MessageEmbedOptions } from "discord.js";
momentDurationFormat(require("moment-timezone"));
import { __ } from "i18n";

class SearchCommand extends Command {
  constructor() {
    super("поиск", {
      aliases: ["search"],
      category: "categories.chat",
      description: "commands.search.desc"
    });
  }

  async exec(message: Message) {
    const handleMessageError = () =>
      message.channel.send(
        this.client.errorEmbed(__("errors.cantSendMessage"))
      );

    if (message.guild !== null)
      message.delete({
        reason: __("commands.search.reasonForMessageDelete")
      });

    const chat = await this.chatRepository.findOne({
      where: [
        { user1_id: message.author.id, ended_at: null },
        { user2_id: message.author.id, ended_at: null }
      ]
    });
    if (chat)
      return message.author
        .send(this.client.errorEmbed(__("errors.youAlreadyInTheChat")))
        .catch(handleMessageError);

    let userSearchRecord = await this.searchRepository.findOne({
      discord_user_id: message.author.id
    });

    if (userSearchRecord) {
      const diff = moment().diff(moment(userSearchRecord.started_at));

      await this.searchRepository.delete(userSearchRecord);
      return message.author
        .send(
          this.client.errorEmbed(
            __(`commands.search.searchHasBeenCancelled`, {
              waitingTime: moment
                .duration(diff, "milliseconds")
                .format(__("other.timeFormat"))
            })
          )
        )
        .catch(handleMessageError);
    }

    userSearchRecord = this.searchRepository.create({
      discord_user_id: message.author.id,
      started_at: new Date(),
      user: this.user
    });
    await this.searchRepository.save(userSearchRecord);

    message.author
      .send(
        this.client.successEmbed(
          __("commands.search.searchHasBeenStarted", {
            count: String((await this.searchRepository.count()) - 1)
          })
        )
      )
      .catch(handleMessageError);

    this.client.emit(
      "searchStarted",
      message.author,
      this.user,
      userSearchRecord
    );
  }
}

export default SearchCommand;
