//import { config } from "dotenv";
//config();
import nodemailer from "nodemailer";
import Joi from "joi";
import https from "https";
import { findUser } from "./MongoFuncs.js";

const SecretKey = process.env.PAYSTACKSRECTKEY;

//create random 6 digits
export function random6() {
    return Math.random().toString().slice(2, 8);
}

export function getTime(locale = "en-US", options = {}) {
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        ...options
    }).format(new Date());
}
// Example output: "November 15, 2023 at 02:30:45 PM"

export function getDateOnly(locale = "en-US", options = {}) {
    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        ...options
    }).format(new Date());
}
// Example output: "November 15, 2023"

export function getTimeOnly(locale = "en-US", options = {}) {
    return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        ...options
    }).format(new Date());
}
// Example output: "02:30:45 PM"

export const initializeTransaction = async (gmail, price) => {
    const params = {
        metadata: {
          ppq : {
            gmail: gmail,
            tokens: price / 10
          }
        },
        email: "ProjectPQuniport@gmail.com",
        amount: price * 100 // amount in kobo
    };

    const options = {
        hostname: "api.paystack.co",
        port: 443,
        path: "/transaction/initialize",
        method: "POST",
        headers: {
            Authorization: `Bearer ${SecretKey}`,
            "Content-Type": "application/json"
        }
    };

    try {
        const response = await new Promise((resolve, reject) => {
            const req = https.request(options, res => {
                let data = "";

                res.on("data", chunk => {
                    data += chunk;
                });

                res.on("end", () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(new Error("Failed to parse response"));
                    }
                });
            });

            req.on("error", error => {
                reject(error);
            });

            req.write(JSON.stringify(params));
            req.end();
        });
        let user = await findUser(gmail);

        let payLoad = {
            transId: response.data.reference,
            status: "pending",
            action: "Bought Tokens",
            cost: price,
            balance: user.tokens,
            date: getDateOnly(),
            time: getTimeOnly()
        };
        //save it to user
        user.details.Transactions.unshift(payLoad);
        user.save();

        return response;
    } catch (error) {
        console.error("Error initializing transaction:", error);
        throw error;
    }
};

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: "gmail", // Use the Gmail service
    auth: {
        user: "ProjectPQuniport@gmail.com", // Your Gmail address
        pass: process.env.GMAILPASS // Your password or app password
    }
});

export async function sendEmail(Recipient, Subject, text, html) {
    try {
        const info = await transporter.sendMail({
            from: '"ProjectPQ Admin" <ProjectPQuniport@ProjectPQ.com>', // Sender info
            to: Recipient, // Recipient address
            subject: Subject, // Subject line
            text: text, // Plain text body
            html: html // HTML body
        });
        console.log("Email sent");
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

export function generateFakeBTCAddress() {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let address = "1"; // BTC addresses usually start with '1' or '3'

    // Generate a random 26-34 character string
    for (let i = 0; i < 33; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        address += chars[randomIndex];
    }

    return address;
}
