import Listener from "../struct/Listener";
import { Chat } from "../entity/Chat.entity";

class ChatStartedListener extends Listener {
  constructor() {
    super("chatStarted", {
      event: "chatStarted",
      emitter: "client"
    });
  }

  async exec(chat: Chat) {
    await this.client.updateChatCount();
  }
}

export default ChatStartedListener;
