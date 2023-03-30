// If not default export write in curly braces
import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/User.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import { Course } from "../models/Course.js";
import cloudinary from "cloudinary"
import getDataUri from "../utils/dataUri.js";
import { Stats } from "../models/Stats.js";

export const register = catchAsyncError(async(req,res,next)=> {
    const {name,email,password} = req.body;
    const file = req.file;//we get file by using the multer as a middleware

    if(!name || !email || !password || !file) return next(new ErrorHandler("Please enter all fields",400));

    // change user later on so let used
    let user = await User.findOne({email})//if user with particular email exist or not
    if(user) return next(new ErrorHandler("User already Exists",409))//send error if user exist

    // We want the uri of the file we get from multer so 
    const fileUri = getDataUri(file); 

    // upload file on cloudinary
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

    user = await User.create({
        name,email,password,avatar:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url,
        },
    })
    sendToken(res,user,"registered successfully",201);
})

export const login = catchAsyncError(async(req,res,next)=> {
    const {email,password} = req.body;

    if( !email || !password) return next(new ErrorHandler("Please enter all fields",400));

    // dont have to change user later on so const
    // Selected password specifically so that we can access the password of thi email
    // ans compare that password with the password user provided
    // if we dont do this then "this.password" will be undefined 
    const user = await User.findOne({email}).select("+password")//if user with particular email exist or not
    if(!user) return next(new ErrorHandler("Incorrect email or password",401))//send error if user exist


    const isMatch = await user.comparePassword(password);

    if(!isMatch) return next(new ErrorHandler("Incorrect email or password",401))

    sendToken(res,user,`Welcome back ${user.name}`,200);
});

export const logout = catchAsyncError(async(req,res,next) => {
    res.status(200).cookie("token",null,{
        expires: new Date(Date.now()),//15days
        httpOnly:true,
        secure:true,
        sameSite:"none",
    }).json({
        success:true,
        message:"Logged Out Successfully"
    })
})

// Can oly be accessed by user who is loggedin
export const getMyProfile = catchAsyncError(async(req,res,next) => {
    // isAuthenticated will check if user is loggedin or n`it
    //If user logged in it will send userId else return
    const user = await User.findById(req.user._id);
    res.status(200).json({
        success:true,
        user,
    })
})

export const changePassword = catchAsyncError(async(req,res,next) => {
    const {oldPassword,newPassword} = req.body;

    // Because we have to compare oldPassword thatswhy "select password"
    const user = await User.findById(req.user._id).select("+password");

    if( !oldPassword || !newPassword) return next(new ErrorHandler("Please enter all fields",400));

    const isMatch = await user.comparePassword(oldPassword);
    if( !isMatch) return next(new ErrorHandler("Incorrect Old Password",400));

    // No need to bcrypt it as we have already defined that when we save user and if password is changed bcrypt it
    user.password=newPassword;

    await user.save();

    res.status(200).json({
        success:true,
        message:"Password changed successfully",
    })
});

export const updateProfile = catchAsyncError(async(req,res,next) => {
    const {name,email} = req.body;

    const user = await User.findById(req.user._id);

    if(name) user.name = name;
    if(email) user.email = email;

    await user.save();

    res.status(200).json({
        success:true,
        message:"Profile updated successfully",
    })
});

export const updateprofilePicture = catchAsyncError(async(req,res,next) => {
 
    const file = req.file;//we get file by using the multer as a middleware

    const user = await User.findById(req.user._id);

    // We want the uri of the file we get from multer so 
    const fileUri = getDataUri(file); 

    // upload file on cloudinary
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    user.avatar = {
        public_id:mycloud.public_id,
        url:mycloud.secure_url,
    }

    await user.save();

    res.status(200).json({
        success:true,
        message:"Profile Picture updated successfully",
    })
});

export const forgetPassword = catchAsyncError(async(req,res,next) => {
    const {email} = req.body;

    const user = await User.findOne({email});

    if(!user) return next(new ErrorHandler("User Not Found",400));

    const resetToken = await user.getResetToken();

    await user.save();//saving the tokrn

    // send token via email
    const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`
    // http://localhost:3000 /resetpassword/resetToken
    const message = `Click on the link to reset yur password. ${url}. If you have not requested then please ignore`
    await sendEmail(user.email,"Coursebundler Reset Password",message);

    res.status(200).json({
        success:true,
        message:`Reset Token has been sent to ${user.email}`,
    })
});

export const resetPassword = catchAsyncError(async(req,res,next) => {
// "token" name should be same as given in route resetpassword/:token
    const {token} = req.params;

    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{
            $gt:Date.now(),//should be greater than date.now() //means token shouldnt be xpired
        }
    })

    if(!user) return next(new ErrorHandler("Reset token invalid or expired"));

    // save the password enetred by user in database
    user.password = req.body.password;
    // because once user enter correct token then we dont need it
    user.resetPasswordExpire=undefined;
    user.resetPasswordToken=undefined;

    await user.save();

    res.status(200).json({
        success:true,
        message:"Password changed successfully",
    })
});

export const addToPlaylist = catchAsyncError(async(req,res,next) => {
    const user = await User.findById(req.user._id);

    const course = await Course.findById(req.body.id);

    if(!course) return next(new ErrorHandler("Invalid Course Id",404));

    // check if course already eexist in user playlist 
    // by comparing current course if with all the courses in the playlist
    const itemExist = user.playlist.find((item) => {
        if(item.course.toString()===course._id.toString()) return true;
    })

    if(itemExist) return next(new ErrorHandler("Item already  exist",409))

    // add course id and poster url in user playlist array
    user.playlist.push({
        course:course._id,
        poster:course.poster.url,
    })
    await user.save();
    res.status(200).json({
        success:true,
        message:"Added to playlist",
    })
});

export const removeFromPlaylist = catchAsyncError(async(req,res,next) => {
    const user = await User.findById(req.user._id);

    // take course id from the query(query passed in the url)
    // http://localhost:4000/api/v1/removefromplaylist?id=64187595544e246f2ac6b521
    // query passed as '?' we passed ?id="" like this and get this id from query         

    const course = await Course.findById(req.query.id);

    if(!course) return next(new ErrorHandler("Invalid Course Id",404));

    // will get all the item in playlist except the one to be deleted
    const newPlaylist = user.playlist.filter( item => {
        if(item.course.toString() !== course._id.toString()) return item;
    })

    user.playlist = newPlaylist;
    await user.save();

    res.status(200).json({
        success:true,
        message:"Removed from playlist",
    }) 
})

// admin controllers
export const getAllUsers = catchAsyncError(async(req,res,next) => {
    const users = await User.find({});

    res.status(200).json({
        success:true,
        users,
    }) 
});

export const updateUserRole = catchAsyncError(async(req,res,next) => {
    const user = await User.findById(req.params.id);

    if(!user) return next(new ErrorHandler("User not found",404))

    if(user.role=="user") user.role="admin"
    else user.role="user";

    await user.save();

    res.status(200).json({
        success:true,
        message:"role updated",
    }) 
})

export const deleteUser = catchAsyncError(async(req,res,next) => {
    const user = await User.findById(req.params.id);

    if(!user) return next(new ErrorHandler("User not found",404))

    // delete profile picture from cloudinary
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    // cancel subscription

    await user.remove();

    res.status(200).json({
        success:true,
        message:"User deleted successfully",
    }) 
})

export const deleteMyProfile = catchAsyncError(async(req,res,next) => {
    const user = await User.findById(req.user._id);

    // delete profile picture from cloudinary
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);

    await user.remove();

    // when delete profile destroy cookie and logout
    res.status(200).cookie("token",null,{
        expires: new Date(Date.now()),
        httpOnly:true,
        // secure:true,
        sameSite:"none",
    }).json({
        success:true,
        message:"User deleted successfully",
    }) 
});

// updates realtme data from database
//on change of data
User.watch().on("change",async()=>{
    const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1);
    const subscription = await User.find({"subscription.status":"active"});

    stats[0].users = await User.countDocuments();
    stats[0].subscription = subscription.length;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
})