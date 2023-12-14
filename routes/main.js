module.exports = function(app, recipeData) {

    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    
    app.get('/', function(req, res) {
        res.render('index.ejs', recipeData);
    });

    // About Route
    app.get('/about', function(req, res) {
        res.render('about.ejs', recipeData); 
    });


    app.get('/search',function(req,res){
        res.render("search.ejs", recipeData);
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM recipes WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the recipes
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, recipeData, {availableRecipes:result});
            console.log(newData)
            res.render("list.ejs", newData)
         });        
    });

    // Add Recipe Route
    app.get('/add-recipe', function(req, res) {
        res.render('add-recipe.ejs', recipeData);
    });


    app.post('/recipe-added', function (req,res) {
        // saving data in database
        let sqlquery = "INSERT INTO recipes (name, calories) VALUES (?,?)";
        // execute sql query
        let newrecord = [req.body.name, req.body.calories];
        db.query(sqlquery, newrecord, (err, result) => {
            if (err) {
            return console.error(err.message);
            }
            else
            res.send(' This recipe is added to database, name: '+ req.body.name + ' calories '+ req.body.calories);
            });
    });   

    // List Recipes Route
    app.get('/list', function(req, res) {
        let sqlQuery = "SELECT * FROM recipes";
        db.query(sqlQuery, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            let newData = Object.assign({}, recipeData, { availableRecipes: result });
            res.render("list.ejs", newData); // Make sure you have a list.ejs file
        });
    });

    //List users
    app.get('/listusers', function(req, res) {
        let sqlQuery = "SELECT id, first_name, last_name, email, username FROM USERDETAILS"; // Exclude the password
        db.query(sqlQuery, (err, result) => {
            if (err) {
                console.error(err);
                res.redirect('/');
            } else {
                let newData = Object.assign({}, recipeData, { users: result });
                res.render("listusers.ejs", newData); // Make sure you have a listusers.ejs file
            }
        });
    });
    

    // Login Route
    app.get('/login', function(req, res) {
        res.render('login.ejs', recipeData);
    });

    app.post('/loggedin', function(req, res) {
        let username = req.body.username;
        let plainPassword = req.body.password;
    
        // SQL query to select the user's hashed password from the database
        let sqlQuery = "SELECT hashed_password FROM USERDETAILS WHERE username = ?";
        
        db.query(sqlQuery, [username], function(err, result) {
            if (err) {
                console.error(err.message);
                res.send("Error occurred during login.");
            } else if (result.length > 0) {
                let hashedPassword = result[0].hashed_password;
    
                // Compare the provided password with the hashed password in the database
                bcrypt.compare(plainPassword, hashedPassword, function(err, compareResult) {
                    if (err) {
                        res.send("Error occurred during password comparison.");
                    } else if (compareResult) {
                        res.send("Login successful! Welcome, " + username);
                    } else {
                        res.send("Login failed. Incorrect username or password.");
                    }
                });
            } else {
                res.send("Login failed. Incorrect username or password.");
            }
        });
    });
    

    // Register Route
    app.get('/register', function(req, res) {
        res.render('register.ejs', recipeData);
    });
    
    app.post('/registered', function (req, res) {
        const plainPassword = req.body.password;
    
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            if (err) {
                return console.error(err.message);
            }
    
            // SQL query to insert user details into the database
            let sqlQuery = "INSERT INTO USERDETAILS (first_name, last_name, email, username, hashed_password) VALUES (?, ?, ?, ?, ?)";

            let newUser = [req.body.first, req.body.last, req.body.email, req.body.username, hashedPassword];
    
            db.query(sqlQuery, newUser, (err, result) => {
                if (err) {
                    return console.error(err.message);
                } else {
                    // Prepare and send the response
                    let responseMessage = 'Hello ' + req.body.first + ' ' + req.body.last + ', you are registered. We will send you an email at ' + req.body.email;
                    responseMessage += '. Your password is: ' + req.body.password + ' and your hashed password is: ' + hashedPassword;
                    res.send(responseMessage);
                }
            });
        });
    });

    app.get('/healthy', function(req, res) {
        let sqlQuery = "SELECT * FROM recipes WHERE calories < 400";
        db.query(sqlQuery, (err, result) => {
            if (err) {
                console.error(err);
                res.redirect('./');
            }
            console.log(result); // Check the output here
            let newData = Object.assign({}, recipeData, { availableRecipes: result });
            res.render("healthy.ejs", newData);
        });
    });
    
    
    // Additional routes for handling form submissions, user authentication, etc., can be added here
};
