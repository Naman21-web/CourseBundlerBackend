import express from "express";
import {config} from "dotenv";
import course from "./routes/courseRoutes.js"
// .js mandatory to write
import user from "./routes/userRoutes.js"
import ErrorMiddleware from "./middlewares/Error.js";
import cookieParser from "cookie-parser";
import payment from "./routes/paymentRoutes.js"
import other from "./routes/otherRoutes.js";
import cors from "cors"

config({
    path:"./config/config.env"
})
const app = express();

// using middlewares //we use this to get data from req.body otherwise we cant use req.body
app.use(express.json());
app.use(
    express.urlencoded({
        extended:true,
    })
)

// to get token from cookies we use it
app.use(cookieParser());

// to access from frontend
app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE"],
    })
  );

app.use("/api/v1",course);
app.use("/api/v1",user);
app.use("/api/v1",payment);
app.use("/api/v1",other);

export default app;

app.get("/", (req, res) =>
  res.send(
    `<h1>Site is Working. click <a href=${process.env.FRONTEND_URL}>here</a> to visit frontend.</h1>`
  )
);

//this is always written at last after al middleware
app.use(ErrorMiddleware);//when called next and no middleware left then this will be called