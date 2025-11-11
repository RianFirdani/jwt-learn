const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {PrismaClient} = require('@prisma/client')

const prisma = new PrismaClient()

const app = express()
app.use(express.json())
app.use(cors())
dotenv.config()

const checkAuth = (req,res,next)=>{
    const {authorization} = req.headers

    if(!authorization) res.status(401).json({message : "Token diperlukan"})
    
    const token = authorization.split(' ')[1]
    const secret = process.env.TOKEN_SECRET

    try{
        const jwtDecode = jwt.verify(token,secret)
        req.userData = jwtDecode
    }catch(e){
        return res.status(401).json({message : "Unauthorize"})
    }
}

app.get('/',checkAuth,async(req,res)=>{
    const data = await prisma.user.findMany()
    res.send(data)
})


app.post('/register',async (req,res)=>{
    const {username,password} = req.body
    const hashPassword =await bcrypt.hash(password,10)
    const duplicate = await prisma.user.findFirst({
        where : {
            username
        }
    })
   if(!duplicate){
     const data = await prisma.user.create({
        data: {
            username : username,
        password : hashPassword
        }
    })
    res.status(200).json({message : "Data berhasil dibuat"})
   }else {
        res.status(400).json({message : "Username sudah ada"})
   }
})

app.post('/login',async (req,res)=>{
    const {username,password} = req.body
    const secret = process.env.TOKEN_SECRET
    const user = await prisma.user.findFirst({
        where : {
            username,
        }
    })
    if(!user) res.status(404).json({message:"User not found!"})
    
    const isSame = await bcrypt.compare(password,user.password)
    if(!password) res.status(404).json({message : "Password is not assigned"})

    if(!isSame) res.status(404).json({message : "Password is Wrong"})

    if(user && isSame) {
        const token = jwt.sign(user,secret)
        return res.status(200).json({
            message : "Login Successfull",
            token
        })
    }
})
app.listen(process.env.PORT,()=>{
    console.log('Server is running on Port : 5000')
})