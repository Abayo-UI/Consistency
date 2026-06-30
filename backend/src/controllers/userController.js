import User from "../models/User.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const createToken =  (id) => {
    if(!process.env.JWT_SECRET_KEY){
        throw new Error("JWT_SECRET_KEY is not defined in the environment.");
    }
    return jwt.sign( {id}, process.env.JWT_SECRET_KEY, { expiresIn: '3d'})
}

export async function signUpController(request, response){
 try{
    const { username, email, password } = request.body;

    if(!email || !password || !username){
        return response.status(400).json({error: "All fields are required"})
    }

    const existingUser = await User.findOne({email})

    if(existingUser){
        return response.status(409).json({ error: "Email already in use" });
    }

    //Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create and save user
    const maximumUser = await User.findOne();

    if(maximumUser){
    return response.status(400).json({
        error: "Only one user account is allowed!"
    });
    }
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();  //we must call the save() method because this creation is only done at computer level unlike the other ones like find which are done at mongoose level, so by calling save() we are ensuring we save it to the mongoDb

    // Create JWT token
    let token;
    try {
      token = createToken(newUser._id);
    } catch (tokenError) {
      console.error("Token generation failed:", tokenError);
      return response.status(500).json({ error: "Failed to generate token" });
    }

    // Send successful response
    return response.status(201).json({ username ,email, token });

  } catch (e) {
    console.error("Signup error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export const loginController = async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({ error: "All fields are required" });
    }

    const foundUser = await User.findOne({ email });

    if (!foundUser) {
      return response.status(404).json({ error: "Email not found. Go the signUp page and signup instead" });
    }

    const matchPassword = await bcrypt.compare(password, foundUser.password);

    if (!matchPassword) {
      return response.status(401).json({ error: "Incorrect password" });
    }

    const token = createToken(foundUser._id);

    return response.status(200).json({ message: "successfully logged in", email, token });
  } catch (e) {
    console.error("Login error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
};

export async function updateUserInfo(request, response) {
  try {
    // requireAuth attaches request.user
    const userId = request.user && request.user._id
    if (!userId) return response.status(401).json({ error: 'Unauthorized' })

    const { name, email, currentPassword, newPassword } = request.body

    const foundUser = await User.findById(userId)
    if (!foundUser) return response.status(404).json({ error: 'User not found' })

    // Password change flow
    if (newPassword) {
      if (!currentPassword) return response.status(400).json({ error: 'Current password is required' })
      const match = await bcrypt.compare(currentPassword, foundUser.password)
      if (!match) return response.status(401).json({ error: 'Current password is incorrect' })

      const salt = await bcrypt.genSalt(10)
      foundUser.password = await bcrypt.hash(newPassword, salt)
      await foundUser.save()
      return response.status(200).json({ message: 'Password updated successfully' })
    }

    // Profile update flow (name/email)
    let changed = false
    if (email && email !== foundUser.email) {
      const exists = await User.findOne({ email })
      if (exists) return response.status(409).json({ error: 'Email already in use' })
      foundUser.email = email
      changed = true
    }
    if (name && name !== foundUser.username) {
      // backend stores username
      foundUser.username = name
      changed = true
    }

    if (changed) {
      await foundUser.save()
    }

    // return updated minimal user info
    return response.status(200).json({ user: { username: foundUser.username, email: foundUser.email, _id: foundUser._id } })
  } catch (e) {
    console.error('Update user error:', e)
    return response.status(500).json({ error: 'Internal server error' })
  }
}

export async function getCurrentUser(request, response) {
  try {
    // `requireAuth` attaches `request.user` with at least `_id`
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(userId).select('username email _id');
    if (!user) return response.status(404).json({ error: 'User not found' });

    return response.status(200).json({ user });
  } catch (err) {
    console.error('Get current user error:', err);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
