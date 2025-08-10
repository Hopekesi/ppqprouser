import { config } from 'dotenv';
import express from "express";
import severless from "serverless-http"; 

import {connectDB} from './Functions/MongoFuncs.js';

import {
  signup,
  login,
  forgotPassword,
  Changepassword,
  wantToken,
  auth,
  share
} from "./Functions/workers.js";

config();


const app = express();
app.use(express.json());
app.use((req, res, next) => {

  res.header('Access-Control-Allow-Origin', '*');

  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});
/*Security*/
//cors origin

//rate limit 15 request per minute


app.get("/", (req, res) =>res.send("ProjectPQ+"));

//starting
app.post("/signup/:gmail/:password/:phone/:mate/:faculty/:department/:avatar", signup);
app.get("/login/:gmail/:password", login);

//forgotpassword
app.put("/forgotpassword/:gmail",forgotPassword);
app.put("/Changepassword/:gmail/:OTP/:password",Changepassword);


//tokens
app.get("/wantToken/:gmail/:price",wantToken);
//share tokens
app.post("/share/:gmail/:password/:amount/:recipt",share);

//paystack buying webwook is not here

//dectuctor
app.put("/auth/:gmail/:password/:request",auth);

app.use((req, res) => {
    console.log("lost soul");
    res.send({
       status:404,
        message: "wrong endpoint"
    });
});


app.listen(process.env.PORT, async () => {
  await connectDB();
  console.log(`http://localhost:${process.env.PORT}`);
});  


//export const handler = severless(app);