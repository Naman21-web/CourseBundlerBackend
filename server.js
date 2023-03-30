// // for encryption of password
// "bcrypt": "^5.0.1",
// // couse poster videos upload in clodinary
// "cloudinary": "^1.30.0",
// // to access cookie
// "cookie-parser": "^1.4.6",
// //cross orogin fetching(api call even if server and frontend in different hosting domain)
// "cors": "^2.8.5",
// //uri of file given by multer
// "datauri": "^4.1.0",
// //configurtion of env variable
// "dotenv": "^16.0.1",
// // 
// "express": "^4.18.1",
// //for login w ehave to create jwt token we make with help of this and store in cookies
// "jsonwebtoken": "^8.5.1",
// //
// "mongoose": "^6.4.4",
// // middleware used to get access of file using req.file (file given and from datauri we get its uri)
// "multer": "^1.4.5-lts.1",
// // fix time p baar baar ek func call karne k liye
// //ex har mahine ki 1 taarik ko ek func call ho
// "node-cron": "^3.0.1",
// // to mail send
// "nodemailer": "^6.7.7",
// // for payment integration
// "razorpay": "^2.8.2",
// // email verify k liye
// "validator": "^13.7.0"

import app from "./app.js";
import { connectDb } from "./config/database.js";
import cloudinary from "cloudinary";
import RazorPay from "razorpay";
import nodeCron from "node-cron";
import { Stats } from "./models/Stats.js";

connectDb();

cloudinary.v2.config({
    cloud_name:process.env.CLOUDINARY_CLIENT_NAME,
    api_key:process.env.CLOUDINARY_CIENT_API,
    api_secret:process.env.CLODINARY_CLIENT_SECRET
});

export const instance = new RazorPay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
  });

//   for creati a stat every month
//   first star->second,second star->minute,third star->hour,fourth star->day,fifth star->month,sixth star->year
nodeCron.schedule("0 0 0 1 * *",async ()=>{//print every month
    // "* * * * * *" or "1 * * * * *" means every second
    // "0 1 * * * *" means every minute
    // "0 0 1 * * *"means every hour and so on
    // console.log("a");//a will printed in console every second
    try{
        await Stats.create({});
    }catch(error){
        console.log(error);
    }
})

await Stats.create({});

app.listen(process.env.PORT,()=>{
    console.log(`Server working on Port: ${process.env.PORT}`);
})