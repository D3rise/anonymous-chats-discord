import Command from "../struct/Command";
import moment from "moment-timezone";
import { Message } from "discord.js";
import i18n, { __ } from "i18n";

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
    const chat = await this.chatRepository.findOne({
      where: [
        { user1_id: message.author.id, ended_at: null },
        { user2_id: message.author.id, ended_at: null }
      ]
    });

    if (!chat)
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
      );

    const embed = this.client.successEmbed(
      __("commands.stop.broHasCancelledTheChat")
    );
    if (chat.user1_id === message.author.id) {
      this.client.users.find(user => user.id === chat.user2_id).send(embed);
    } else {
      this.client.users.find(user => user.id === chat.user1_id).send(embed);
    }

    chat.ended_at = new Date();
    await this.chatRepository.save(chat);

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

export default StopSearchCommand;
