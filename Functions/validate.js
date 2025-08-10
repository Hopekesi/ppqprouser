import Joi from "joi";
import { random6,getTime, getTimeOnly, getDateOnly,generateFakeBTCAddress} from "./func.js";


//Create a user object
export function FormatUsers(req){       
  let user = {
            gmail: isGmail(req.params.gmail),
            avatar: isString(req.params.avatar),
            wallet:generateFakeBTCAddress(),
            password: isString(req.params.password),
            phone: isPhone(req.params.phone),
            mate: isString(req.params.mate),
            faculty: isString(req.params.faculty),
            department: isString(req.params.department),
            tokens: 0,
            OTP: random6(),
            details: {
              logins:[],
                created: getTime(),
                Transactions: []
            }
        };
  return user;
}

/*
                  { action: "Created Account",
                  cost: 0,
                  balance:100,
                  date: getDateOnly(),
                  time: getTimeOnly() 
                  }

*/


//check if input is a String
export function isString(variable) {
    // Validate that the input is a string with length 3-30
    const { error } = Joi.string().min(3).max(30).validate(variable);
    if (error) {
        throw new Error(
            `Input (${variable}) must be a string of length > 3 and < 30 characters.`
        );
    }

    return variable;
}

//check if input is a number
export function isNumber(variable) {
    variable = Number(variable);
    const schemaString = Joi.object({
        name: Joi.number().required()
    });
    const { error } = schemaString.validate({ name: variable });

    if (error || variable < 1) {
        // Custom error message with the validation details
        const errorMessage = `You input (${variable}) should be a number`;
        throw new Error(errorMessage);
    }
    return variable;
}

//check if input is a phone number
export function isPhone(variable) {
    const schemaString = Joi.object({
        name: Joi.number().required()
    });
    const { error } = schemaString.validate({ name: variable });
    if (error || !(variable.length === 10)) {
        // Custom error message with the validation details
        const errorMessage = `You input (${variable}) should be a phone number (e.g., 9000000000, 8100000000, 7000000800, etc)`;
        throw new Error(errorMessage);
    }
    return Number(variable);
}

//check if input is a gmail
export function isGmail(email) {
  
    if (typeof email !== "string" ||(!email.endsWith("@gmail.com") && !email.endsWith("@googlemail.com"))) {
        throw new Error(
            `You input (${email}) should be a Gmail address. (e.g., example@gmail.com)`
        );
    }
    
      

    return email;
}

