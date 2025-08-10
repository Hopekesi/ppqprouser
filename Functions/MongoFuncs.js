
import mongoose from "mongoose";
import {
    sendEmail,
    random6,
    getTime,
    getTimeOnly,
    getDateOnly
} from "./func.js";

const UserSchema = new mongoose.Schema({
    wallet: {
        type: String,
        unique: true, // Ensures no duplicate wallets
        minLength: 26, // Minimum BTC address length (e.g., P2PKH)
        maxLength: 35, // Maximum BTC address length (e.g., Bech32)
        match: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Basic BTC address regex
        required: [true, "Regenerate another wallet adders"] // Optional: Enforce wallet creation
    },

    gmail: {
        type: String,
        lowercase: true,
        minLength: 5,
        maxLength: 39,
        unique: true
    },

    phone: {
        type: Number
    },
    avatar: {
        type: String
    },
    password: {
        type: String,
        minLength: 7
    },

    mate: {
        type: String,
        minLength: 4,
        maxLength: 5
    },

    faculty: {
        type: String,
        minLength: 3,
        maxLength: 20
    },
    department: {
        type: String,
        minLength: 3,
        maxLength: 20
    },

    tokens: {
        type: Number,
        default: 0,
        required: true
    },
    OTP: Number,

    details: {
        logins: Array,
        created: String, // Consider using `Date` instead of `String`
        Transactions: [] // Could be an array of transaction objects
    }
});

//Transactions history nit savubg
export const PermiumUser = mongoose.model("PermiumUser", UserSchema);

//connect to database
export async function connectDB() {
    const Mongodb_url = process.env.MONGODBURL;

    await mongoose.connect(Mongodb_url).then(() => console.log("connected"));
}

//Find a user by gmail
export async function findUser(gmail) {
    return await PermiumUser.findOne({ gmail: gmail }).exec();
}

//Find matching password
export async function findUserSecured(gmail, password) {
    let user = await findUser(gmail);
    if (!user) throw new Error(`${gmail} is not a user yet...`);
    if (user.password === password) {
        return user;
    }
    throw new Error("Wrong password");
    return;
}

//Create new user
export async function createUser(user) {
    const {
        gmail,
        avatar,
        wallet,
        phone,
        password,
        mate,
        faculty,
        department,
        tokens,
        details,
        OTP
    } = user;
    //check if user is present
    let isHere = await findUser(gmail);
    if (isHere) throw new Error(`${gmail} has an account please login.`);

    let newUser = new PermiumUser({
        avatar,
        gmail,
        wallet,
        phone,
        password,
        mate,
        faculty,
        department,
        tokens,
        details,
        OTP
    });
    await newUser.save();
    let myMessage = `
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;'>
    <h1 style='color: #2c3e50; font-size: 24px; margin-bottom: 16px; text-align: center;'>
        Welcome to ProjectPQ !
    </h1>
    
    <p style='color: #34495e; font-size: 16px; line-height: 1.5; margin-bottom: 24px;'>
        Your account has been successfully created. We're excited to have you on board!
    </p>
    
    <div style='text-align: center; margin-bottom: 24px;'>
        <a href='https://ProjectPQ.name.ng' style='background-color: #3498db; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;'>
           Let's Study 
        </a>
    </div>
    
    <p style='color: #7f8c8d; font-size: 14px; line-height: 1.5; margin-bottom: 0;'>
        If you did not create this account, please contact our support team immediately.
    </p>
</div>
`;

    await sendEmail(
        user.gmail,
        "Welcome to ProjectPQ!",
        "Your account has been successfully created. We’re excited to have you on board!",
        myMessage
    );
    console.log(`New user ${gmail} saved`);
}

export async function changeOtp(user) {
    //reset token
    user.OTP = random6();
    user.__v = user.__v + 1;
    // await sendOtp(user.OTP, GAmail)
    let myMessage = `
<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;'>
    <h1 style='color: #2c3e50; font-size: 24px; margin-bottom: 24px;'>Your One-Time Password (OTP)</h1>
    
    <p style='color: #34495e; font-size: 16px; line-height: 1.5; margin-bottom: 24px;'>
        For security purposes, please use the following One-Time Password to verify your identity:
    </p>
    
    <div style='background-color: #f8f9fa; border-radius: 4px; padding: 16px; text-align: center; margin-bottom: 24px;'>
        <span style='font-size: 32px; font-weight: bold; letter-spacing: 2px; color: #2c3e50;'>
            ${user.OTP}
        </span>
    </div>
    
    <p style='color: #7f8c8d; font-size: 14px; line-height: 1.5; margin-bottom: 0;'>
        This code is valid for a limited time only. Please do not share it with anyone.
    </p>
    
    <p style='color: #7f8c8d; font-size: 14px; line-height: 1.5; margin-top: 16px; margin-bottom: 0;'>
        If you didn't request this OTP, please ignore this message.
    </p>
</div>
`;

    await sendEmail(
        user.gmail,
        "Your One-Time Password (OTP)",
        `Your OTP is ${user.OTP}`,
        myMessage
    );
    user.save();
    return user;
}

//deductTokens
export async function deductTokens(gmail, amount, notes) {
    try {
        const user = await PermiumUser.findOne({ gmail: gmail });
        if (!user) throw new Error(`User ${gmail} not found`);

        if (user.tokens + amount < 0) {
            throw new Error(
                `Insufficient tokens. Current balance: ${user.tokens}`
            );
        }

        const trans = {
            transId: Date.now(),
            action: notes,
            cost: amount,
            balance: user.tokens + amount,
            date: getDateOnly(),
            time: getTimeOnly()
        };

        // Initialize details if not exists
        if (!user.details) user.details = { Transactions: [] };
        if (!user.details.Transactions) user.details.Transactions = [];

        user.tokens += amount;
        user.details.Transactions.push(trans);
        user.markModified("details"); // Important for mixed types

        await user.save();
        return true;
    } catch (error) {
        console.error(`Error in deductTokens for ${gmail}:`, error);
        throw error;
    }
}
