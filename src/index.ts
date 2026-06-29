import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import peopleRouter from "./routes/people.routes";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api/people", peopleRouter)

app.listen(8000, () => {
  console.log("Server running on port 8000");
});