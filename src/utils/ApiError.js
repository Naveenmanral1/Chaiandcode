class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack   // maybe this line stack spelling is incorrect
        }else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export{ApiError}