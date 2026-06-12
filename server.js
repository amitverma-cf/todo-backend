import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const connectDb = async () => {
    const mongodb = await mongoose.connect(process.env.MONGODB_URL)
    console.log(`Mongodb connected`)
}
await connectDb()

app.listen(5000, () => console.log("App Running"))

const todoSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    email: { type: String, required: true }
}, { timestamps: true })

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true },
    password: { type: String, required: true }
}, { timestamps: true })

const todoModel = mongoose.model("todos", todoSchema)
const userModel = mongoose.model("users", userSchema)

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(" ")[1];
        const user = jwt.verify(token, "secret")
        req.user = user;
        next()
    } catch (e) {
        console.log(e)
        res.status(401).json({ message: "Invalid Token" })
    }
}

app.get("/todo", authenticate, async (req, res) => {
    try {
        const todos = await todoModel.find({ email: req.user.email })
        res.json(todos)
    } catch (e) {
        console.log(e)
        res.json({ message: "Get Todos failed" })
    }
})

app.post("/todo", authenticate, async (req, res) => {
    try {
        const { text } = req.body
        const r = await todoModel.create({ text, email: req.user.email })
        res.json({ message: "Todo added", data: r })
    } catch (e) {
        console.log(e)
        res.json({ message: "Post Todos failed" })
    }
})

app.delete("/todo/:id", authenticate, async (req, res) => {
    try {
        const { id } = req.params
        const todo = await todoModel.findById({ _id: id })
        if (!id || !todo || todo.email !== req.user.email) {
            res.json({ message: "Not your todo, can't delete" })
        } else {
            const r = await todoModel.deleteOne({ _id: id })
            res.json({ message: "Todo deleted", data: r })
        }
    } catch (e) {
        console.log(e)
        res.json({ message: "Delete Todos failed" })
    }
})

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userFound = await userModel.findOne({ email });
        if (!userFound) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const chkPass = await bcrypt.compare(password, userFound.password);
        if (!chkPass) {
            return res.status(401).json({ success: false, message: "Wrong Password" });
        }
        const user = { id: userFound._id, name: userFound.name, email: userFound.email };
        const token = jwt.sign(user, "secret", { expiresIn: "1h" });
        return res.status(200).json({ success: true, user, token });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/register", async (req, res) => {
    try {
        const userData = req.body;
        const exists = await userModel.findOne({ email: userData.email });
        if (exists) {
            return res.status(400).json({ success: false, message: "Email exists" });
        }
        userData.password = await bcrypt.hash(userData.password, 10);
        const createdUser = await userModel.create(userData);
        return res.status(201).json({ success: true, data: createdUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});