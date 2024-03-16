import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {user} from "../models/user.model.js"
import {cloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req , res) =>{
    //get user detail from frontend
    //validation - not empty

    const{fullname,email,username,password} = req.body
     
    if(
        [fullname,email,username,password].some((field)=>
        field?.trim() === "")
        ){
            throw new ApiError(400,"All fields are required")
        }

    const existedUser = User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const converImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(converImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // check the spelling or captial letter in user/User
    const createdUser = await user.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
      throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )

})

export {registerUser} 