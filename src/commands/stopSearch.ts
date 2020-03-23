import Command from "../struct/Command";
import moment from "moment-timezone";
import { Message } from "discord.js";
import { __ } from "i18n";

class StopSearchCommand extends Command {
  constructor() {
    super("stop-search", {
      aliases: ["stop-search"],
      category: "categories.chat",
      prefix: "!",
      channel: "dm",
      description: "commands.stopSearch.desc"
    });
  }

  async exec(message: Message) {
    const chat = this.chat;

    if (!chat)
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
      );

    const embed = this.client.successEmbed(
      __("commands.stop.broHasCancelledTheChat")
    );
    if (chat.user1Id === message.author.id) {
      this.client.users.find(user => user.id === chat.user2Id).send(embed);
    } else {
      this.client.users.find(user => user.id === chat.user1Id).send(embed);
    }

    chat.endedAt = new Date();
    await this.chatRepository.save(chat);

    this.client.updateChatCount();
    message.channel.send(
      this.client.successEmbed(__("commands.stop.chatIsOver"))
    );

    // SEARCH COMMAND //
    const handleMessageError = () =>
      message.channel.send(
        this.client.errorEmbed(__("errors.cantSendMessage"))
      );

    if (message.guild !== null)
      message.delete({
        reason: __("commands.search.reasonForMessageDelete")
      });

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

export default StopSearchCommand;
