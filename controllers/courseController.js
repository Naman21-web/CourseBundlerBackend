import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { Course } from "../models/Course.js"
import getDataUri from "../utils/dataUri.js";
import ErrorHandler from "../utils/errorHandler.js";
import cloudinary from "cloudinary";
import multer from "multer";
import { Stats } from "../models/Stats.js";

export const getAllCourses = catchAsyncError(async (req,res,next) => {

    const keyword = req.query.keyword || "";
    const category = req.query.category || "";

    //func will not execute till we get value from await
    //We are getting all the courses from Course model
    const courses = await Course.find({
        title:{
            $regex:keyword,//because title not exact
            $options:"i"//means case insensitive
        },
        category:{
            $regex:category,//because title not exact
            $options:"i"//means case insensitive
        }
    }).select("-lectures");//as we dont want lectures array so we exclude it
    // as we will only give it to user when user subscribes else we will show all courses
    res.status(200).json({//after getting we send status 200 and success as true and all courses that we get from above
        success:true,
        courses,
    });
});

export const createCourse = catchAsyncError(async (req,res,next) => {
    // we dont take lectures as we will add it later
    // views and noOfvideos by default 0 so not take
    const {title,description,category,createdBy} = req.body;

    if(!title || !description || !category || !createdBy) return next(new ErrorHandler("Please add all fields",400));
    // message = "Please add all fields" and statusCode=400 passed inside ErrorHandler
    //next will call next middleware but we dont pass any middleware in the route after createCourse
    // so it will go to ErrorMiddleware(which is inside Error.js) by passing our own created ErrorHandler.js file
    //  which handles error

    const file = req.file;//we get file by using the multer as a middleware

    // We want the uri of the file we get from multer so 
    const fileUri = getDataUri(file); 

    // upload file on cloudinary
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

    await Course.create({
        title,description,category,createdBy,poster:{
            public_id:mycloud.public_id,//will get from cloudinary
            url:mycloud.secure_url,
        }
    })
    res.status(201).json({//201 means created successfully
        success:true,
        message:"Course created successfully. You can add lectures now",
    });  ; 
});

export const getCourseLectures = catchAsyncError(async (req,res,next) => {
    const course = await Course.findById(req.params.id);
    if(!course) return next(new ErrorHandler("Course not found",404));

    course.views += 1;

    await course.save();

    res.status(200).json({//after getting we send status 200 and success as true and all courses that we get from above
        success:true,
        lectures: course.lectures,
    });
});

// max video size = 100mb as we are using free version of cloudinary and 100mb is limit in it
export const addLecture = catchAsyncError(async (req,res,next) => {
    const {id} = req.params;
    const {title,description} = req.body;

    const course = await Course.findById(id);
    if(!course) return next(new ErrorHandler("Course not found",404));

    const file = req.file;

    // We want the uri of the file we get from multer so 
    const fileUri = getDataUri(file); 

    // upload file on cloudinary
    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content,{
        resource_type:"video",
    });

    course.lectures.push({
        title,description,video:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url,
        }
    })

    course.numOfVideos = course.lectures.length;

    await course.save();

    res.status(200).json({//after getting we send status 200 and success as true and all courses that we get from above
        success:true,
        message:"Lecture added in course"
    });
});

export const deleteCourse = catchAsyncError(async (req,res,next) => {
    const {id} = req.params;

    const course = await Course.findById(id);
    if(!course) return next(new ErrorHandler("Course not found",404));

    // to delete course by public id
    // thatwhy we took public id
    // first we delete its poster
    await cloudinary.v2.uploader.destroy(course.poster.public_id);

    // delete each lecture
    for(let i=0;i<course.lectures.length;i++){
        const singleLecture = course.lectures[i];
        await cloudinary.v2.uploader.destroy(singleLecture.video.public_id,{
            resource_type:"video",
        });
    }

    await course.remove();

    res.status(200).json({
        success:true,
        message:"Course deleted successfully"
    });
});

export const deleteLecture = catchAsyncError(async (req,res,next) => {
    const {courseId,lectureId} = req.query;

    const course = await Course.findById(courseId);
    if(!course) return next(new ErrorHandler("Course not found",404));

    const lecture = course.lectures.find((item) => {
        if(item._id.toString() === lectureId.toString()) return item;
    });

    await cloudinary.v2.uploader.destroy(lecture.video.public_id,{
        resource_type:"video",
    });

    course.lectures = course.lectures.filter(item => {
        if(item._id.toString() !== lectureId.toString()) return item;
    })

    course.numOfVideos = course.lectures.length;


    await course.save();

    res.status(200).json({
        success:true,
        message:"Lecture deleted successfully"
    });
});

Course.watch().on("change",async() => {
    const stats = await Stats.find({}).sort({createdAt:"desc"}).limit(1);

    const courses = await Course.find({});

    let totalViews=0;
    for(let i=0;i<courses.length;i++){
        totalViews += courses[i].views;
    }

    stats[0].views = totalViews;
    stats[0].createdAt = new Date(Date.now());

    await stats[0].save();
})