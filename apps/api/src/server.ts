import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";

async function bootstrap() {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
