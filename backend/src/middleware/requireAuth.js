import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const requireAuth = async (request, response, next) => {
  const { authorization } = request.headers;

  if (!authorization) {
    return response.status(401).json({ error: "You don't have this permission.Authorization token required" });
  }
  
  //authorisation looks like this "Beares  token" thats why we'er accessing the second array Item 
  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).select("_id");
// decoded looks something like this becaause earlier we stored {id} in our createToken function
// {
//   id: "6a0dedd4ead35627600c0489",
//   iat: 1748000000,
//   exp: 1749000000
// }
    if (!user) {
      return response.status(401).json({ error: "user not found" });
    }

    request.user = user;//I'm adding the admin property to the request object so that we can access the admin Id that we will make it available in the ratelimit.limit()
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return response.status(401).json({ error: "Request is not authorized" });
  }
};

export default requireAuth;