import express from "express";
import helmet from "helmet";
import cors from "cors";
import { errorMiddleware } from "./utils/errors";
import routes from "./routes";

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", routes);

app.use(errorMiddleware);

export default app;
