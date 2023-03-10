const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser")
const {auth} = require("./middlewares/prevent");  
const crypto = require('crypto');
const {checkIfLoggedIn} = require("./middlewares/prevent")
require("dotenv").config();

const LocalStorage = require("node-localstorage").LocalStorage
const connection = mysql.createPool(
    {
        host: 'localhost',
        user: 'root',
        database: 'jwt',
        password: 'root'

    }
)
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
    let token = req.cookies.token;
    if (token) {
        res.redirect("/home")
    }
    res.render("register")
})
app.get("/login", (req, res) => {
    let token = req.cookies.token;
    if (token) {
        res.redirect("/home")
    }
    res.render("login", { error: "" })
})

app.post("/login", async (req, res) => {
    const loginErrors = {};
    const { email, pass } = req.body;
    let query = `SELECT * FROM user where name = '${email}'`;
    let results = await connection.execute(query);
    results = results[0]
    if(results[0].isActivated == "0"){
        return res.send("Seems like you have created an account, but haven't activated yet.")
    }
    if (results.length == 0) {
        loginErrors.message = "There are no users with this name";
        return res.render("login", { error: loginErrors });
    }
    console.log(results);
    let dbPass = results[0].password;
    const isMatch = await bcrypt.compare(pass, dbPass);
    if (!isMatch) {
        loginErrors.message = "Oops your password is wrong";
        console.log(loginErrors);


        return res.render("login", { error: loginErrors });
    }
    let token = jwt.sign(results[0], process.env.SECRET_KEY);
    res.cookie("token", token, { maxAge: 900000 });
    res.redirect("/home")

})
app.post("/store", async (req, res) => {
    let newPass = await bcrypt.hash(req.body.password, 10);
    // const {username, password, email} = req.body
    const checkQuery = `SELECT * FROM user where email = '${req.body.email}'`;
    const checkRes = await connection.execute(checkQuery);
    if (checkRes[0].length != 0) {
        return res.send("There is already user assosiated with that email.")
    }
    const sqlQuery = `INSERT INTO user (name, email, password) VALUES('${req.body.username}', '${req.body.email}', '${newPass}')`;

    const results = await connection.execute(sqlQuery);
    let insertId = results[0].insertId

    if (results) {
        let payload = {
            name: req.body.username,
            email: req.body.email,
            id: insertId
        }
        let token = jwt.sign(payload, process.env.SECRET_KEY);
        res.cookie("token", token, { maxAge: 900000 });
        // TODO: we can also use concept of crypto for generating those jaggerish link.
        // const buf = crypto.randomBytes(60).toString('hex');
        res.render("activation", {insertId})
    }
})

app.get("/update/:id", async (req, res) => {
    let id = req.params.id;
    let token = req.cookies.token;
    let decode = jwt.verify(token, process.env.SECRET_KEY);
    
    if (decode.id != id) {
        return res.send("You are not authorized")
    }
    let sqlQuery = `SELECT * FROM user where id = ${id}`;
    let sqlresult = await connection.execute(sqlQuery);
    res.render("update.ejs", { res: sqlresult[0][0], success: "" })
})

app.get("/activate/:id", async(req, res) => {
    let id = req.params.id;

    let token = req.cookies.token;
    let decode = jwt.verify(token, process.env.SECRET_KEY);
    
    if (decode.id != id) {
        return res.send("You are not authorized")
    }

    let query = `UPDATE user set isActivated = '1' where id = ${id}`;
    let executeQuery = await connection.execute(query);
    console.log(executeQuery);
    if(executeQuery[0].affectedRows == 0){
        return res.send("oops there has been a problem ")
    }else{
        // return res.send("Account is Verified.")
        return res.render("login", {error: {success: "Your account has been verified! You are good to go!"}})
    }
})
app.post("/update", async (req, res) => {
    let { email, name, oldpass, newpass, id } = req.body;

    let getPassword = `SELECT * FROM user where id = ${id}`;
    const getHashPassword = await connection.execute(getPassword);
    let passwordData = getHashPassword[0];

    if (!oldpass && !newpass) {
        newpass = passwordData[0].password;
        let updateQuery = `UPDATE user SET name = '${name}', email = '${email}', password = '${newpass}' where id = ${id}`;
        const executePassword = await connection.execute(updateQuery);
        if (executePassword) {
            console.log(passwordData);
            res.render("update", { success: "Your data has been updated successfully", res: passwordData[0] })
        }
    }
    else {
        console.log(oldpass, passwordData[0].password);
        let isMatch = await bcrypt.compare(oldpass, passwordData[0].password);
        console.log(isMatch);
        if (isMatch) {
            let newPass = await bcrypt.hash(newpass, 10);
            let updateQuery = `UPDATE user SET name = '${name}', email = '${email}', password = '${newPass}' where id = ${id}`;
            const executePassword = await connection.execute(updateQuery);
            if (executePassword) {
                console.log(passwordData);
                res.render("update", { success: "Your data has been updated successfully", res: passwordData[0] })
            }
        }
        else {
            res.render("update", { success: "The old password was incorrect", res: passwordData[0] })
        }
    }


})

app.post("/check-user", async(req, res) => {
    console.log("came here");
    let getName = req.body.name;
    let sqlQuery = `SELECT * FROM user where name = '${getName}'`;
    let results = await connection.execute(sqlQuery);
    console.log(results[0]);
    if(results[0].length){
        return res.json({status: "exist"})
    }
    else{
        return res.json({status: "not"})
    }
})

app.post("/check-user-email", async(req, res) => {
    let getEmail = req.body.email;
    let sqlQuery = `SELECT * FROM user where email = '${getEmail}'`;
    let results = await connection.execute(sqlQuery);
    console.log(results[0]);
    if(results[0].length){
        return res.json({status: "exist"})
    }
    else{
        return res.json({status: "not"})
    }
})


app.get("/home", auth, async (req, res) => {
   console.log(req.user);
   let query = `SELECT * FROM user where id = ${req.user.id} and isActivated = '1'`;
   let andQuery = await connection.execute(query);
   console.log("And Query", andQuery);
   if(andQuery[0].length == 0){
    return res.send("This account hasn't been activated yet.");
    //    return res.redirect("/")
   }else{
       return res.render("home", { username: req.user.name, id: req.user?.id })
   }
})
app.get("/logout", (req, res) => {
    res.clearCookie("token");
    return res.redirect("/")
})
app.listen(3001, () => {
    console.log("Server running");
})