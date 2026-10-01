import app from "./app";
import { PORT } from "./config/env";
import { logger } from "./lib/logger";

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});