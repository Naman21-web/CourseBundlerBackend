import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto"

const schema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: validator.isEmail,
    },
  
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  
    subscription: {
      id: String,
      status: String,
    },
  
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  
    playlist: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
        },
        poster: String,
      },
    ],
  
    createdAt: {
      type: Date,
      default: Date.now,
    },
  
    resetPasswordToken: String,
    resetPasswordExpire: String,
  });

// To hash the password
  schema.pre("save", async function(next) {
    // In case of profie update ,profilepic update password is not modified
    // so If password is not modified no need to bcrypt it as it is already bcrypted
    if(!this.isModified("password")) return next();
    // we get password from this.password and we hash itin 10 rounds
    const hashedPassword=await bcrypt.hash(this.password,10)
    //10 rounds more the rounds more secured the password more the time to bcrypt
    this.password = hashedPassword //saving hashed password in database password
    next
  })

//   generating the token
  schema.methods.getJWTToken = function(){
    return jwt.sign({_id:this._id},process.env.JWT_SECRET,{
        expiresIn:"15d",
    })//this.__id means user.id  //id of this user
  }

  //   comparing the password
  schema.methods.comparePassword = async function(password){
    console.log(this.password);
    return await bcrypt.compare(password,this.password)//comparin the password which we got while logging 
    // and password saved in database
    
  }
  
  schema.methods.getResetToken = function(){
    // crypto is inbuilt package in nodejs we dont need to install it
    // will get a random 20 letters token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // using "sha256" algorith for hashing
    // passing resetToken inside .update because we want to hash resetToken
    // .digest to convert to hex we can also use toString instead of it
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")
    this.resetPasswordExpire = Date.now() + 15*60*100 //expires in 15 minutes
    // We have set resetPasswordToken and resetPassswordExpire to verify that the token which user type is same
    // as the token which we sent and to verify that we compare user token with this.resetPasswordToken
    // and will also see if token time is expired or not

    return resetToken;
  }

export const User = mongoose.model("User",schema);