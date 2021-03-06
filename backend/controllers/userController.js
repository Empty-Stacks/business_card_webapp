const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const asyncHandler = require('express-async-handler')
const User = require('../models/userModel')
const session = require('express-session')
const cookieParser = require('cookie-parser')
 


// @desc Register new User
// @route POST /api/users
// @access Public

const registerUser = asyncHandler(async (req, res) =>
{
    const {name, email, password } = req.body
    
    if(!name || !email || !password) {

        res.status(400)
        throw new Error('Please fill in all fields')
    }

    //Check if user already exists

    const userExists = await User.findOne({email})
    if(userExists)
    {
        res.status(400)
        throw new Error('User already exists')
    }

    //Hash User password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    //Create user in DB
    const user = await User.create({
        name,
        email,
        password: hashedPassword
    })

    if(user)
    {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            token:  generateToken(user._id)
        })
    }
    else{
        res.status(400)
        throw new Error('Invalid User Data')
    }
    
    res.json({message: "sadfds"})
})

// @desc Login user
// @route POST /api/users/login
// @access Public
const loginUser = asyncHandler(async(req, res) =>
{
    const{email, password} = req.body
    
    //Checks if email exists in DB
    const user = await User.findOne({email})
    
    if(user && (await bcrypt.compare(password, user.password)))
    {

        res.header('Access-Control-Allow-Credentials', true)
        res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        .cookie('token', generateToken(user._id) , {httpOnly: false, expires: new Date(Date.now() + 3600000 )})
        .cookie('username', user.name, {httpOnly: false, expires: new Date(Date.now() + 3600000 )})

        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
        })


    }
    else
    {
        res.status(400)
        throw new Error('Invalid Credentials')
    }

})

// @desc Get user data
// @route GET /api/users/me
// @access Private
const getMe = asyncHandler(async(req, res) =>
{
   const { _id, name, email} = await User.findById(req.user.id)

   res.status(200).json({
       id: _id,
       name,
       email,
   })
})

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d',
    })
}

module.exports = {
    registerUser, loginUser, getMe
}