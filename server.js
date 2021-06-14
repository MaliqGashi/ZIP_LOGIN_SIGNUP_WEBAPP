//Configure .env
require("dotenv").config();

//Import modules
const express = require("express");
const session = require("express-session")
const { body, validationResult } = require("express-validator");
const path = require("path");
const bcrypt = require("bcrypt");
const Ip = require("ip");

const app = express();

//Disable x-powered-by header
app.disable("x-powered-by");

const { pool } = require("./database_configuration");

//Middeleware
app.use(express.static(path.join(__dirname, "/node_modules/jquery/dist/")));
app.use(express.static(path.join(__dirname, "static")));
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs");

//Use url encoded body parser
app.use(express.urlencoded({ extended: true }));

//Use json body parser
app.use(express.json());

//Use express sessions
app.use(session({
    secret: String(process.env.CS_SECRET),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

//Server constants
const PORT = 8080;
const ip = Ip.address();

//SIGNUP RENDER
app.get("/signup", (req, res) => {
    res.render("signup");
    res.status(200);
    res.end()
})

//LOGIN RENDER
app.get("/login", (req, res) => {
    res.render("login");
    res.status(200);
    res.end();
})

//LOGIN LOGIC
app.get("/logout", (req, res) => {
    req.session.user_status = false;
    res.redirect("/login")
    res.status(200);
    res.end();
})

//LOGIN RENDER
app.get("/home", (req, res) => {
    if(!req.session.user_status) {
        res.set("text/html").status(200).end(`<p>Please login to view this page! Go back to <a href="/login">Login</a> page.</p>`);
        return;
    }

    res.render("home", {
        firstname: req.session.firstname,
        lastname: req.session.lastname
    })
})

//SIGNUP LOGIC
app.post("/signupauth", [
    body("firstname", "Firstname field is empty!").not().isEmpty(),
    body("lastname", "Lastname field is empty!").not().isEmpty(),
    body("username").custom(async (username) => {
        if(username === "") {
            return Promise.reject("Username field is empty!")
        }

        return (async () => { 
            var client = null;
            await(async() => {
                client = await pool.connect();
            })().catch(err => {
                return Promise.reject("An error occurred while connectiong to the database")
            })

            try {
                const userData = await client.query(`SELECT * FROM user_data WHERE username='${username}'`);
                if(userData.rows.length > 0){
                    return Promise.reject("An account with that username already exists!");
                }
                return true;
            }catch(err) {
                console.log("Error in get user data query");
            }finally {
                if(client !== null) {
                    client.release();
                    client = null;
                }
            }
        })().catch(err => {
            return Promise.reject(err);
        })
    }),
    body("password", "Password must be at least 8 characters long!").trim().isLength({min: 8}).custom((password, { req }) => {
        if(password !== req.body.confpassword) {
            return Promise.reject("Password and Confirm password fileds are not the same!")
        }
        return true;
    })
] ,async(req, res) => {
    const validation_result = validationResult(req);

    if(!validation_result.isEmpty()) {
        let allErrors = await validation_result.errors.map(error => error.msg);

        res.render("signup", {
            errors: allErrors,
            old_data: await req.body
        })
        res.status(200);
        res.end();
        return;
    }

    var client = null;
    const { firstname, lastname, username, password } = await req.body;

    try {
        client = await pool.connect();
        
        const hash_pass = await bcrypt.hash(password, 12);
        
        await client.query(`INSERT INTO user_data(firstname, lastname, username, password) VALUES('${firstname}','${lastname}','${username}','${hash_pass}')`);

        res.redirect("/signup");
    }catch(err) {
        console.log("Error in insert user data query");

        res.render("signup",{
            errors: ["An error occurred while connectiong to the database!!!"],
            old_data: await req.body,
        });
        res.status(200);
        res.end();
    }finally {
        if(client !== null) {
            client.release();
            client = null;
        }
    }
})

//LOGIN LOGIC
app.post("/loginauth",
[
    body("username").custom(async (username) => {
        if(username === "") {
            return Promise.reject("Username field is empty!")
        }

        return (async () => { 
            var client = null;
            await(async() => {
                client = await pool.connect();
            })().catch(err => {
                return Promise.reject("An error occurred while connectiong to the database")
            })

            try {
                const userData = await client.query(`SELECT * FROM user_data WHERE username='${username}'`);
                if(userData.rows.length === 0){
                    return Promise.reject("An account with that username does not exist");
                }
                return true;
            }catch(err) {
                console.log("Error in get user data query");
            }finally {
                if(client !== null) {
                    client.release();
                    client = null;
                }
            }
        })().catch(err => {
            return Promise.reject(err);
        })
    }),
    body("password", "Password field is empty!").not().isEmpty()
], async(req, res) => {
    const validation_result = validationResult(req);

    if(!validation_result.isEmpty()) {
        let allErrors = await validation_result.errors.map(error => error.msg);

        res.render("login", {
            errors: allErrors,
            old_data: await req.body
        })
        res.status(200);
        res.end();
        return;
    }

    var client = null;
    const { username, password } = await req.body;

    try {
        client = await pool.connect();
        const userData = await client.query(`SELECT * FROM user_data WHERE username='${username}'`);
        const hash_pass = userData.rows[0].password;

        const compare_result = await bcrypt.compare(password, hash_pass);

        if(compare_result) {
            req.session.user_status = true;
            req.session.firstname = userData.rows[0].firstname;
            req.session.lastname = userData.rows[0].lastname;

            res.redirect("/home");
        }else {
            req.session.user_status = false;

            res.render("login", {
                errors: ["Incorrect password"],
                old_data: await req.body,
            });
        }
    }catch(err) {
        console.log("Error in get user password query");

        res.render("login",{
            errors: ["An error occurred while connectiong to the database!!!"],
            old_data: await req.body,
        });
        res.status(200);
        res.end();
    }finally {
        if(client !== null) {
            client.release();
            client = null;
        }
    }
})

//NOT FOUND 404 PAGE
app.use("/", (req, res) => {
    res.set("text/html").status(404).end(`<h1 style="text-align: center; font-size: 50px;">404 Page Not Found!</h1>`);
});

//RUN APP/SERVER ON PORT 8080
app.listen(PORT, (err) => {
    if(!err) {
        console.log(`Server listening on http://localhost:${PORT} or http://${ip}:${PORT}`);
    }else {
        console.log(`Error on http://localhost:${PORT} or http://${ip}:${PORT}`);
    }
})