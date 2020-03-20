import { Listener, ListenerOptions } from "discord-akairo";
import CustomClient from "./Client";

class CustomListener extends Listener {
  client: CustomClient;

  constructor(id: string, options?: ListenerOptions) {
    super(id, options);
  }
}

export default CustomListener;
