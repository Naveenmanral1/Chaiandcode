//require('dotenv').config({path:`./env`})
import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";


dotenv.config({
    path:`./env`
})

connectDB()
.then(()=>{
    app.listen (process.env.PORT||8000,()=>{
        console.log(`Server is running at port :${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGO db connetion failed !!!",err)
})


/*
import { Express } from "express";
const app = Express()

(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("Errr:",error);
        throw error
       })

     app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
     })

    } catch (error) {
        console.error("ERROR:",error)
        throw err
    }
})()

*/