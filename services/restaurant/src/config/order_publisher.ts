import { getChannel } from "./rabbitmq.js";

export const publishEvent = async (type: string, data: any) => {
  const channel = getChannel();

  const payload = {
    type,
    data,
  };

  channel.sendToQueue(
    process.env.ORDER_READY_QUEUE!,
    Buffer.from(JSON.stringify(payload)),
    {
      persistent: true,
    },
  );

  console.log("Published Event:", payload);
};
