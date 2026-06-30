import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()

const connectDb = async () => {
    try{
    await mongoose.connect(process.env.MONGO_URI)
    console.log("succcessfully connected to the Database")
    }
    catch(e){
    console.log("Error connecting to the database")
    process.exit(1);//Exit with failure because our app solely depends on the database.So whenever we fail to connect to our database, nothing will go on in our app. It will just stop everything
    }
}

export default connectDb;