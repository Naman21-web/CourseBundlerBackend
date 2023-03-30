// we get the passedfunction which is passed when we use this 
export const catchAsyncError = (passedFunction) => (req,res,next) => {
    // instead of this return we use 1 more arrow 
    // return () => {

    // }
    // This will resolve the promise
    // No need to write catch(next) => {} //will automaticlly be handled by func if error occours
    Promise.resolve(passedFunction(req,res,next)).catch(next);

    // suppose this middleware contains func getAllCourses
    //so when this completed next will take it to sd1 and then to sd2 and then at last 2when nthng left then to Error.js 
    // router.route("/courses").get(getAllCourses,sd1,sd2);
}