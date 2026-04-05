import { env } from "./config/env";
import { app } from "./app";
import { connectMongo } from "./lib/mongo";

async function startServer(): Promise<void> {
  await connectMongo();
  app.listen(env.PORT, () => {
    console.log(`Finance dashboard backend running on port ${env.PORT}`);
  });
}

if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true" && process.env.VERCEL !== "1") {
  void startServer();
}

export { app };
