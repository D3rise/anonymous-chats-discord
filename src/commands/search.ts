import Command from "../struct/Command";
import moment from "moment-timezone";
import momentDurationFormat from "moment-duration-format";
import { Message, MessageEmbed, MessageEmbedOptions } from "discord.js";
/* tslint:disable */
momentDurationFormat(require("moment-timezone"));
/* tslint:enable */
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

    const chat = this.chat;
    if (chat)
      return message.author
        .send(this.client.errorEmbed(__("errors.youAlreadyInTheChat")))
        .catch(handleMessageError);

    let userSearchRecord = await this.searchRepository.findOne({
      discordUserId: message.author.id
    });

    if (userSearchRecord) {
      const diff = moment().diff(moment(userSearchRecord.startedAt));

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

    if (this.user.config.guild && !message.guild) {
      return message.channel.send(
        this.client.errorEmbed(
          __("errors.guildSearchUnavaliableChangeTheSetting", {
            prefix: this.client.options.defaultPrefix
          })
        )
      );
    }

    userSearchRecord = this.searchRepository.create({
      discordUserId: message.author.id,
      startedAt: new Date(),
      user: this.user
    });

    if (message.guild) {
      userSearchRecord.guildId = message.guild.id;
    }

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
