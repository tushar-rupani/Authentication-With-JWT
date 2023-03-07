const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser")
const connection = mysql.createPool(
    {
    host:'localhost',
    user:'root',
    database:'jwt',
    password:'root'
    
}
)
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(__dirname +'/public'));

app.get("/", (req, res) => {
    let token = req.cookies.token;
    if(token){
        res.redirect("/home")
    }
    res.render("register")
})
app.get("/login", (req, res) => {
    let token = req.cookies.token;
    if(token){
        res.redirect("/home")
    }
    res.render("login")
})

app.post("/login", async(req, res) => {
    const {email, pass} = req.body;
    let query = `SELECT * FROM user where email = '${email}'`;
    let results = await connection.execute(query);
    results = results[0]
    if(results.length == 0){
        return res.json({msg:"There are no users with this name"});
    }
    console.log(results);
    let dbPass = results[0].password;
    console.log(dbPass, pass);
    const isMatch = await bcrypt.compare(pass, dbPass);
    if(!isMatch){
        return res.send("Oops! Password wrong!")
    }

    let token = jwt.sign(results[0], "tushar");
    res.cookie("token", token,  {maxAge: 900000});
    res.redirect("/home")
    
})
app.post("/store", async(req, res) => {
    let newPass = await bcrypt.hash(req.body.password, 10);
    // const {username, password, email} = req.body
    const checkQuery = `SELECT * FROM user where email = '${req.body.email}'`;
    const checkRes = await connection.execute(checkQuery);
    console.log(checkRes);
    if(checkRes[0].length != 0){
        return res.send("There is already user assosiated with that email.")
    }
    const sqlQuery = `INSERT INTO user (name, email, password) VALUES('${req.body.username}', '${req.body.email}', '${newPass}')`;

    const results = await connection.execute(sqlQuery);
    console.log(results[0]);

    if(results){
        let payload = {
            name: req.body.username,
            email: req.bodyemail
        }
        let token = jwt.sign(payload, "tushar");
        res.cookie("token", token,  {maxAge: 900000});
        res.redirect("/home")
    }
})

app.get("/home", (req, res) => {
    const token = req.cookies.token;
    if(!token){
        return res.redirect("/")
    }

    const decode = jwt.verify(token, "tushar");
    console.log(decode);
    res.render("home", {username: decode.name})
})

app.get("/logout", (req, res) => {
    res.clearCookie("token");
    return res.redirect("/")
})
app.listen(3000, () => {
    console.log("Server running");
})