import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { application } from "express";

const generateAccessAndRefreshToken = async(userId)=>
{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating referesh token ")
    }
}

const registerUser = asyncHandler(async (req , res) =>{
    //get user detail from frontend
    //validation - not empty
    // check if user already exists : username , email
    // check for image and avatar
    // upload them to cloudinary , avatar
    // create user object , create entry in db
    // romove password and referesh token field from response
    // check for user creation 
    // return res


    const {fullname,email,username,password} = req.body
     
    if(
        [fullname,email,username,password].some((field)=>
        field?.trim() === "")
        ){
            throw new ApiError(400,"All fields are required")
        }

    const existedUser = await User.findOne({    // user to User kiya h
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //?. after cover image help ki agr to cover image upload nhi bhi kreag to y error nhi dega
    const converImageLocalPath = req.files?.coverImage?.[0]?.path;

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
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
      throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )

})

const loginUser = asyncHandler(async(req,res)=>{

     // req body -> data
     // username or email
     // find the user
     // password check
     // access and refersh token
     // send cookie

  const {email,username,password} = req.body

  if(!(username || email)){
    throw ApiError(400,"Username or email is required")
  }

  const user = await User.findOne({
    $or:[{username},{email}]
  })

  if(!user){
    throw ApiError(404 , "User does not exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw ApiError(401 , "Invalid password")
  }


  const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly : true,
    secure : true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,
        {
            user : loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully"
        )
  )
})


const logOutUser = asyncHandler(async(req,res)=>{
   User.findByIdAndUpdate(
    req.user._id,
    {
        $set : {
            refreshToken:undefined
        }
    },
    {
        new : true
    }
   )

   const options = {
    httpOnly : true,
    secure : true
  }

  return res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User logged Out"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
       const user = await User.findById(decodedToken?._id)
    
       if(!user){
        throw new ApiError(401, "Invalid refresh token")
       }
    
       if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
       }
    
       const options = {
        httpOnly : true,
        secure : true
       }
    
       const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
       return res.status(200)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",newRefreshToken,options)
       .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access token refreshed"
        )
       )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token" )
    }
 
})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken
} 