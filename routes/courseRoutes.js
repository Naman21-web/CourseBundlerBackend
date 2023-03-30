import express from "express";
import { addLecture, createCourse, deleteCourse, deleteLecture, getAllCourses, getCourseLectures } from "../controllers/courseController.js";
import { authorizeAdmin, authorizeSubscribers, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

// Get all courses without lectures
router.route("/courses").get(getAllCourses);

// create new course only admin
// through singleupload middleware we can access multer file using req.file
router.route("/createcourse").post(isAuthenticated,authorizeAdmin,singleUpload,createCourse);

// Add lecture,Delete course,Get course detail
router.route("/course/:id")
    .get(isAuthenticated,authorizeSubscribers,getCourseLectures)
    .post(isAuthenticated,authorizeAdmin,singleUpload,addLecture)
    .delete(isAuthenticated,authorizeAdmin,deleteCourse);

// Delete Lecture
router.route("/lecture").delete(isAuthenticated,authorizeAdmin,deleteLecture);

export default router;
//export defaul so any name can be used while importing
//if we use export const then only this name can be used