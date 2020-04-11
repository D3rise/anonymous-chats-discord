import Listener from "../struct/Listener";
import { Chat } from "../entity/Chat.entity";

class ChatStartedListener extends Listener {
  constructor() {
    super("chatStarted", {
      event: "chatStarted",
      emitter: "client",
    });
  }

  async exec(chat: Chat) {
    this.client.logger.debug(`Started new chat with id ${chat.id}`);
  }
}

export default ChatStartedListener;
