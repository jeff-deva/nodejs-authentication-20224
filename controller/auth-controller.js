const User = require('../models/user');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
//register controller
const registerUser = async (req, res) => {
  try {
    //extract user information from our request body
    const { username, email, password, role } = req.body;

    //check if the user is already exists in our database
    const checkExistingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (checkExistingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User is already exists either with same username or same email. Please try with a different username or email",
      });
    }

    //hash user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create a new user and save in your database
    const newlyCreatedUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await newlyCreatedUser.save();

    if (newlyCreatedUser) {
      res.status(201).json({
        success: true,
        message: "User registered successfully!",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Unable to register user! please try again.",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured! Please try again",
    });
  }
};
const cloudinary =require('../config/cloudniary');

// login controller
const loginUser = async (req, res) => {
  try{
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password"
        });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password); 
        if (!isPasswordMatch) {
          return res.status(400).json({
            success: false,
            message: "Invalid username or password"
            });
            }
            const accessToken = jwt.sign({ userId: user._id,
            username: user.username,
            role: user.role
             }, process.env.JWT_SECRET_KEY,{
              expiresIn: "15m"
             });
             
             res.status(200).json({
              success: true,
              message: "User logged in successfully",
              accessToken
             });


  }catch(e){
    console.log(e);
    res.status(500).json({
      success : false,
      message : "Error registering user"
    });
  }
}; 


const changePassword = async (req, res) => {
  try {
    const userId = req.userInfo.userId;

    //extract old and new password;
    const { oldPassword, newPassword } = req.body;

    //find the current logged in user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    //check if the old password is correct
    const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is not correct! Please try again.",
      });
    }

    //hash the new password here
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    //update user password
    user.password = newHashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured! Please try again",
    });
  }
};

const deleteImageController = async (req, res) => {
  try {
    const currentImageId = req.pramas.id;
    const userId = req.userInfo.userId;
    
    //find the user
    const user = await User.findById(userId);
    //find the image
    const image = await Image.findById(currentImageId);
    if(!image){
      return res.status(404).json({
        success: false,
        message: "Image not found",
        });
        
    }
    //check if the user owns the image
    if (image.uploadedBy.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: "You don't own this image",
        });
        }
        //delete the image from the cloudinary
        await cloudinary.uploader.destroy(image.publicId);
        //delete the image from the database
        await image.findByIdAndUpdate(currentImageId);
           
        res.status(200).json({
          success: true,
          message: "Image deleted successfully",
          });
          } catch (e) {
            console.log(e);
            res.status(500).json({
              success: false,
              message: "Some error occured! Please try again",
              });
              }
              

module.exports = { 
  registerUser,
  loginUser,
  changePassword,
  deleteImageController };
};