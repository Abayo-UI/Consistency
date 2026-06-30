import express from "express"
import requireAuth from "../middleware/requireAuth.js"
import { signUpController, loginController, updateUserInfo, getCurrentUser } from "../controllers/userController.js"

const router = express.Router()

router.post("/signup", signUpController)
router.post("/login", loginController)
// protect update route so only authenticated users can change profile or password
router.put("/updateInfo", requireAuth, updateUserInfo)
router.get("/me", requireAuth, getCurrentUser)

export default router;