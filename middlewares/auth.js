import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncError } from "./catchAsyncError.js";

export const isAuthenticated = catchAsyncError(async (req,res,next) => {
// get token from cookies
    const {token} = req.cookies;

    // if token doesnt exist means user is not logged in so we pass not log in message
    if(!token) return next(new ErrorHandler("Not Logged in",401));

    // decoded id object
    const decoded = jwt.verify(token,process.env.JWT_SECRET);

    // will find user by id
    req.user = await User.findById(decoded._id);

    // Go to next middleware which is getMyProfile
    // We pass this middleware before getMyProfile in the routes
    // So that when user doesnt exist this middleware will throw error
    // and when user exist it will go to getMyProfile middleware
    next();

})

// so that only admin allowed to create course
export const authorizeAdmin = (req,res,next) => {
    if(req.user.role !== "admin") return next(new ErrorHandler(
        `${req.user.role} is not allowed to access this resource`,
        403));

    next();
}

// only subscribers allowed to access course
export const authorizeSubscribers = (req,res,next) => {
    if(req.user.subscription.status !== "active" && req.user.role !== "admin") return next(new ErrorHandler(
        `Only subscriber can access this resource access this resource`,
        403));

    next();
}