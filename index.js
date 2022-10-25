const express = require("express")
const app = express()
const cors = require("cors")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
require("dotenv").config()

app.use(cors())
app.use(express.static("public"))
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html")
})

app.use(bodyParser.urlencoded({ extended: false }))

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

let userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    versionKey: false,
  }
)

let exerciseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
    },
  },
  {
    _id: false,
    versionKey: false,
  }
)

let logSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    count: {
      type: Number,
      required: true,
    },
    _id: {
      type: String,
      required: true,
    },
    log: {
      type: [exerciseSchema],
      required: true,
    },
  },
  {
    versionKey: false,
  }
)

let User = mongoose.model("User", userSchema)
let Log = mongoose.model("Log", logSchema)

app.post("/api/users", (req, res) => {
  User.findOne({ username: req.body.username }).then((doc) => {
    if (doc) {
      res.json(doc) // if found, send
    } else {
      let newUser = new User({
        username: req.body.username,
      })

      newUser.save().then((doc) => {
        let newLog = new Log({
          username: doc.username,
          _id: doc._id,
          count: 0,
          log: [],
        })
        newLog.save()
        res.json(doc)
      }) // add new user
    }
  })
})

app.get("/api/users", (req, res) => {
  User.find({}).then((doc) => {
    // get all users
    res.send(doc)
  })
})

app.post("/api/users/:_id/exercises", (req, res) => {
  const id = req.params._id
  const date = req.body.date
  User.findOne({ _id: id }).then((doc) => {
    json = {
      description: req.body.description,
      duration: Number(req.body.duration),
      date: date ? new Date(date).toDateString() : new Date().toDateString(),
    }

    Log.findOne({ _id: id }).then((ele) => {
      if (ele) {
        ele.log.push(json)
        ele.count = ele.log.length
        ele.save()
        // console.log(ele)
      }
    })

    res.json({ _id: doc._id, username: doc.username, ...json })
  })
})

app.get("/api/users/:_id/logs", (req, res) => {
  Log.findOne({ _id: req.params._id }).then((doc) => {
    let sol = doc
    if (req.query.from) {
      sol.log = sol.log.filter((ele) => {
        const from = new Date(req.query.from)
        const date = new Date(ele.date)
        return date > from
      })
    }
    if (req.query.to) {
      sol.log = sol.log.filter((ele) => {
        const to = new Date(req.query.to)
        const date = new Date(ele.date)
        return date < to
      })
    }
    if (req.query.limit) {
      sol.log = sol.log.slice(0, req.query.limit)
    }
    sol.count = sol.log.length
    res.json(sol)
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port)
})
