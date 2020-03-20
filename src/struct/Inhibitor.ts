import { Inhibitor, InhibitorOptions } from "discord-akairo";
import Client from "./Client";

class CustomInhibitor extends Inhibitor {
  client: Client;

  constructor(id: string, options?: InhibitorOptions) {
    super(id, options);
  }
}

export default CustomInhibitor;
