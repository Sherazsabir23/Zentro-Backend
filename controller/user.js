const User = require("../models/user");
const bcrypt = require("bcrypt");
const {generateToken }= require("../middleware/authmiddleware")
const sendEmail = require("../utils/sendEmail");
const sellerApplication = require("../models/sellerSchema");



/* handle Signup */
async function handleSignup(req,res){
     try{

        const {userName,userPassword,userEmail} = req.body;

        const existingUser = await User.findOne({email:userEmail});
        if(existingUser) {
            return res.status(400).json({message:"User Already Exist"});
        }

          const otp = Math.floor(100000 + Math.random()*900000).toString();
        const otpExpiry = new Date(Date.now() + 5*60*1000);

       
      
        const user = await User.create({
            name:userName,
            password:userPassword,
            email:userEmail,
            otp:otp,
            otpExpiry:otpExpiry,

        })

        
await sendEmail(
  user.email,
  "Verify your Email - OTP",  // subject
  `<h1>Verify your Email - OTP</h1>
   <p>Hi ${user.name},</p>
   <p>Your OTP is: <b>${otp}</b></p>`
);

       
       res.status(201).json({
        success:true,
        user:user,
        message:"User Created successfully",
       })
        
     }catch(err){
      console.error("❌ Signup error:", err);
        res.status(500).json({
            success:false,
            message:"internal server error",
            error:err.message
        })
     }
}



/* handle Login */

async function handleLogin(req,res){
    try{
const {userEmail,userPassword} = req.body;

const user  = await User.findOne({email:userEmail});

if(!user.isVerified) {
  return res.status(401).json({message:"please verify your email before logging", success:false, unverified:true,
  })
}
if(!user){
    return res.status(404).json({success:false,message:"first signup to login"});
}
 
    
const isMatch = await bcrypt.compare(userPassword,user.password);
  if(!isMatch){
    return res.status(401).json({success:false,message:"invalid email or password"});
  }

  const payload={
    id:user.id,
    email:user.email,
    role:user.role

  }

  const token = generateToken(payload);

    res.cookie("token", token, {
  httpOnly: true,       // ✅ prevent JS access
   secure: false,
  sameSite: "lax",     // ✅ allow cross-site requests
});

res.status(200).json({
    success:true,
    message:"login successfully",
    user,
})
    }catch(err){
    console.error("Login error:",err);
    return res.status(500).json({ success: false, message: "Server error" });
    }
}


   /* Verify token handle */

async function verifyOtp(req, res) {
  try {
    const { email,otp } = req.body;
    const user = await User.findOne({ email:email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Email Verified" });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}


  /*  handle me api */
async function handleMe(req, res) {
  try {

    const user = await User.findById(req.user.id); // id from token middleware
    if (!user) {
      
      return res.status(404).json({ message: "User not found", success: false });
    }

    
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Error in /me API:", err);
    res.status(500).json({ message: "Server error in me API", success: false });
  }
}
 


 async function handleUserProfile(req, res) {
  try {
    const { name, email, address, phone } = req.body;
    const id = req.params.id;
    const user = await User.findById(id);

    user.name = name;
    user.email = email;
    user.address = address;
    user.phone = phone;

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`; 
    }

   const updatedUser =  await user.save();

    res.status(200).json({
      success: true,
      updatedUser,
      message: "User profile updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

module.exports = {
    handleSignup,
    handleLogin,
    verifyOtp,
    handleMe,
    handleUserProfile,
}


