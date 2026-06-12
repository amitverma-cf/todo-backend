import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const connectDb = async () => {
    const mongodb = await mongoose.connect(process.env.MONGODB_URL)
    console.log(`Mongodb connected ${mongodb.version}`)
}
await connectDb()

app.listen(5000, () => console.log("App Running"))

const todoSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String },
}, { timestamps: true })

const todoModel = mongoose.model("todos", todoSchema)

app.get("/todo/get", async (req, res) => {
    try {
        const todos = await todoModel.find()
        res.json(todos)
    } catch (e) {
        console.log(e)
        res.json({ message: "Get Todos failed" })
    }
})

app.post("/todo", async (req, res) => {
    try {
        const todo = req.body
        const r = await todoModel.create(todo)
        res.json({ message: "Todo added", data: r })
    } catch (e) {
        console.log(e)
        res.json({ message: "Post Todos failed" })
    }
})

app.delete("/todo/:id", async (req, res) => {
    try {
        const { id } = req.params
        const r = await todoModel.deleteOne({ _id: id })
        res.json({ message: "Todo deleted", data: r })
    } catch (e) {
        console.log(e)
        res.json({ message: "Delete Todos failed" })
    }
})