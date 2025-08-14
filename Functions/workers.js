import {
    isPhone,
    isString,
    isGmail,
    isNumber,
    FormatUsers
} from "./validate.js";
import {
    random6,
    getDateOnly,
    getTimeOnly,
    getTime,
    initializeTransaction
} from "./func.js";
import {
    createUser,
    findUserSecured,
    findUser,
    changeOtp,
    deductTokens
} from "./MongoFuncs.js";

export async function signup(req, res) {
    try {
        //Validate if inputs are in the right
        const user = FormatUsers(req);
        //add to database
        await createUser(user);
        //communicate to user
        res.send({
            success: true,
            message: `${user.gmail} is now a user :) \n Please Login.`
        });
    } catch (e) {
        console.log(e.message);
        res.send({
            success: false,
            message: `Premium User was Not  Created: ${e.message}`
        });
    }
}





export async function login(req, res) {
    try {
        //Validate input if string
        let gmail = isString(req.params.gmail);
        //Validate input if string
        let password = isString(req.params.password);
        //get user and check if passeord matcehes
        const user = await findUserSecured(gmail, password);

        user.details.logins.push({
            time: getTimeOnly(),
            date: getDateOnly()
        });
        await user.save();
        let displayDetails = {
            gmail: user.gmail,
            password: user.password,
            id: user._id,
            wallet: user.wallet,
            tokens: user.tokens,
            avatar: user.avatar
        };

        if (!user) throw new Error("Wrong password");
        //send the user to frontend
        res.send({
            success: true,
            message: displayDetails
        });
    } catch (e) {
        res.send({
            success: false,
            message: `Unable to login : ${e.message}`
        });
    }
}

export async function forgotPassword(req, res) {
    try {
        //Validate input
        const {
            gmail
        } = req.params;
        isGmail(gmail);
        //Validate gmail is ours
        let user = await findUser(gmail);
        if (!user) throw new Error("Please sign up");
        //rest OTP and send to the own's gmail
        user = await changeOtp(user);
        res.send({
            success: true,
            message: `Check your gmail , copy the OTP and paste it here. `
        });
    } catch (e) {
        console.log(e.message);
        res.send({
            success: false,
            message: `Error : ${e.message}`
        });
    }
}

export async function Changepassword(req, res) {
    try {
        //Validate gmail, OTP , newpassword

        let {
            gmail,
            OTP,
            password
        } = req.params;
        isGmail(gmail);
        isNumber(OTP);
        isString(password);
        OTP = Number(OTP);

        //check OTP
        let user = await findUser(gmail);
        if (!user) throw new Error("Not yet a user");
        if (user.OTP === OTP) {
            //update the password
            user.password = password;
            //rest OTP
            user.OTP = random6();
            user.__v = user.__v + 1;
            user.save();
        } else {
            throw new Error("Wrong OTP ");
        }

        //send succees message
        res.send({
            success: true,
            message: "Password changed"
        });
    } catch (e) {
        console.log(e.message);
        res.send({
            success: false,
            message: `Could not change password : ${e.message}`
        });
    }
}

export async function auth(req, res) {
    try {
        let {
            gmail,
            password,
            request
        } = req.params;
        isString(password);
        isString(request);
        isGmail(gmail);

        let info = await deductTokens(
            gmail,
            password,
            -1,
            `Requested :  ${request}`
        );
        res.send({
            success: true,
            message: info
        });
    } catch (e) {
        res.send({
            success: false,
            message: e.message
        });
    }
}

export async function wantToken(req, res) {
    try {
        //Validate gmail is string
        const {
            gmail,
            price
        } = req.params;
        isNumber(price);
        isGmail(gmail);
        //is a user
        /*MongoSearchGmail()*/
        let user = await findUser(gmail);
        if (!user) throw new Error("Not a User");
        //paystack intialize(gmaill,amount)

        const response = await initializeTransaction(gmail, price);
        const authorizationUrl = await response.data.authorization_url;
        console.log("Redirect user to:", authorizationUrl);

        //send asses code
        res.send({
            success: true,
            message: response
        });
    } catch (e) {
        console.log(e.message);
        res.send({
            success: false,
            message: `Error : ${e.message}`
        });
    }
}

export async function share(req, res) {
    try {
        let {
            gmail,
            amount,
            recipt
        } = req.params;
        isString(gmail);
        isString(recipt);
        amount = isNumber(amount);

        if (amount < 1) throw new Error(`You can share ${amount} tokens`);
        //Add Validate password
        let user = await findUserSecured(gmail, password);

        if (!user) throw new Error(`${gmail} is not a user`);

        if (user.tokens < amount + 2) throw new Error(
            `Insufficient tokens, you need more than ${
            amount + 2
            } to share.`
        );

        let removeT = -1 * amount;

        // Validate recipt
        let reciever = await findUser(recipt);
        if(reciever) throw new Error(`${recipt} is not a user`);
       //Debit
        await deductTokens(gmail, removeT, `Shared ${amount} to ${recipt}`);
        await deductTokens(
            gmail,
            -2,
            `Charge for Sharing ${amount} to ${recipt}`
        );
        //Credit
        await deductTokens(recipt, amount, `Recieved ${amount} from ${gmail}`);

        res.send({
            success: true,
            message: `You just shared ${amount} tokens to user  ${recipt}`
        });
    } catch (err) {
        console.log(err.message);
        res.send({
            success: false,
            message: `Falied to share : ${err.message}`
        });
    }
}