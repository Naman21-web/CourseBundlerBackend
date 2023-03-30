// when we throw error we send message but err.statusCode is not present inside that it will always be undefined
//so to handle it we use this
//This class extend the error created in middlewares
class ErrorHandler extends Error {
    constructor(message,statusCode){
        //This contains message and statusCode which will be passed when we use this class constructor 
        // and pass message and statusCode inside it
        
        // will use message from super class constructor
        super(message);//will take message from errorclass since that is superclass so super is used
        this.statusCode=statusCode;//take statuscode 
    }
}

export default ErrorHandler;