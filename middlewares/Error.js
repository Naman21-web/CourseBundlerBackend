const ErrorMiddleware = (err,req,res,next) => {
    // when we throw error we send message but err.statusCode is not present inside that it will always be undefined
    //so to handle it we use this we created errorHandler in utils
    // When new error throwed we pass statusCode and messae inside it
    // and that will be sent to this middleware by Errorhandler.js
    err.statusCode = err.statusCode || 500;//If statuscode present else 500
    err.message = err.message || "Internal Server Error";//If error message presenst else "Internal Server Error" message
    res.status(err.statusCode).json({
        success:false,
        message:err.message,
    })
}
export default ErrorMiddleware;