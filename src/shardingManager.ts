import { ShardingManager } from "discord.js";
import path from "path";
const manager = new ShardingManager(path.join("dist", "bot.js"), {
  totalShards: Number(process.env.SHARD_COUNT),
  mode: "process"
});

manager.spawn();
