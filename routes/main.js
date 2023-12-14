module.exports = function(app, recipeData) {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;

    const { check, validationResult } = require('express-validator');

    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('/login');
        } else {
            next();
        }
    };

    app.get('/', function(req, res) {
        res.render('index.ejs', recipeData);
    });

    app.get('/about', function(req, res) {
        res.render('about.ejs', recipeData); 
    });

    app.get('/search',function(req,res){
        res.render("search.ejs", recipeData);
    });

    app.get('/search-result', function (req, res) {
        let sqlquery = "SELECT * FROM recipes WHERE name LIKE '%" + req.query.keyword + "%'";
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            let newData = Object.assign({}, recipeData, {availableRecipes:result});
            res.render("list.ejs", newData);
        });        
    });

    app.get('/add-recipe', redirectLogin, function(req, res) {
        res.render('add-recipe.ejs', recipeData);
    });

    app.post('/recipe-added', [
        // Validate recipe name - it should not be empty
        check('name', 'Recipe name is required').not().isEmpty(),
    
        // Validate calories - it should be an integer
        check('calories', 'Calories must be a valid integer').isInt(),
    
    ], function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Handle validation errors
            return res.status(400).json({ errors: errors.array() });
        }
    
        // Proceed with adding the recipe to the database
        let sqlquery = "INSERT INTO recipes (name, calories) VALUES (?, ?)";
        let newRecipe = [req.body.name, req.body.calories];
        db.query(sqlquery, newRecipe, (err, result) => {
            if (err) {
                // Handle database errors
                console.error(err.message);
                return res.send('Error occurred during database operation');
            }
            res.send('Recipe added successfully!');
        });
    });

    app.get('/list', redirectLogin, function(req, res) {
        let sqlQuery = "SELECT * FROM recipes";
        db.query(sqlQuery, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            let newData = Object.assign({}, recipeData, { availableRecipes: result });
            res.render("list.ejs", newData);
        });
    });

    app.get('/listusers', redirectLogin, function(req, res) {
        let sqlQuery = "SELECT id, first_name, last_name, email, username FROM USERDETAILS";
        db.query(sqlQuery, (err, result) => {
            if (err) {
                res.redirect('/');
            } else {
                let newData = Object.assign({}, recipeData, { users: result });
                res.render("listusers.ejs", newData);
            }
        });
    });

    app.get('/login', function(req, res) {
        res.render('login.ejs', recipeData);
    });

    app.post('/loggedin', function(req, res) {
        const username = req.body.username;
        const plainPassword = req.body.password;

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
                        // Save user session here, when login is successful
                        req.session.userId = username;
                        // Redirect to the main page
                        res.redirect('/');
                    } else {
                        res.send("Login failed. Incorrect username or password.");
                    }
                });
            } else {
                res.send("Login failed. Incorrect username or password.");
            }
        });
    });

    app.get('/logout', redirectLogin, (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.redirect('/');
            }
            res.send('You are now logged out. <a href="/">Home</a>');
        });
    });

    app.get('/register', function(req, res) {
        res.render('register.ejs', recipeData);
    });
    
    app.post('/registered', [
        // Validate email
        check('email').isEmail().withMessage('Enter a valid email address'),
    
        // Validate password length and complexity
        check('password', 'Password must be at least 8 characters long and include uppercase, lowercase, numbers, and symbols')
            .isLength({ min: 8 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/),
    
        // Validate that passwords match
        check('confirmPassword', 'Passwords do not match').custom((value, { req }) => value === req.body.password),
    
        // Validate username
        check('username', 'Username is required and must be 3-20 characters long').isLength({ min: 3, max: 20 }),
    
        // Validate first and last name
        check('first', 'First name is required').not().isEmpty(),
        check('last', 'Last name is required').not().isEmpty(),
    
        // Add more validation as necessary
    ], function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Handle validation errors
            return res.status(400).json({ errors: errors.array() });
        }
    
        // Sanitize inputs
        let sanitizedFirstName = req.sanitize(req.body.first);
        let sanitizedLastName = req.sanitize(req.body.last);
        let sanitizedEmail = req.sanitize(req.body.email);
        let sanitizedUsername = req.sanitize(req.body.username);
    
        // Proceed with the registration process
        const plainPassword = req.body.password;
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            if (err) {
                // Handle hashing error
                return res.send('Error during password hashing');
            }
    
            // SQL query to insert user details into the database
            let sqlQuery = "INSERT INTO USERDETAILS (first_name, last_name, email, username, hashed_password) VALUES (?, ?, ?, ?, ?)";
            let newUser = [sanitizedFirstName, sanitizedLastName, sanitizedEmail, sanitizedUsername, hashedPassword];
    
            db.query(sqlQuery, newUser, (err, result) => {
                if (err) {
                    // Handle database errors
                    console.error(err.message);
                    return res.send('Error occurred during database operation');
                }
                res.send('Registration successful! Welcome, ' + sanitizedFirstName);
            });
        });
    });
    

    app.get('/deleteuser', redirectLogin, function(req, res) {
        res.render('deleteuser.ejs', recipeData);
    });

    app.post('/userdeleted', redirectLogin, function(req, res) {
        let username = req.body.username;
        let sqlQuery = "DELETE FROM USERDETAILS WHERE username = ?";
        db.query(sqlQuery, [username], function(err, result) {
            if (err) {
                console.error(err.message);
                res.send("Error occurred while trying to delete user.");
            } else {
                res.send("User " + username + " has been successfully deleted.");
            }
        });
    });
    
    app.get('/healthy', function(req, res) {
        let sqlQuery = "SELECT * FROM recipes WHERE calories < 400"; // Adjust calorie threshold as needed
        db.query(sqlQuery, (err, result) => {
            if (err) {
                console.error(err);
                res.redirect('/'); // Redirect to home page or show an error message
            } else {
                res.render("healthy.ejs", { availableRecipes: result, siteName: recipeData.siteName });
            }
        });
    });
    
    //-----------------------------------------------------

    app.get('/searchmeal', function(req, res) {
        res.render('searchmeal');
    });
    
    
    app.post('/searchmeal', function(req, res) {
        const request = require('request');
        let searchTerm = req.body.mealName;
        let url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${searchTerm}`;
    
        request(url, function(err, response, body) {
            if (err) {
                res.render('mealresults', { error: 'Error, please try again', meals: null });
            } else {
                let meals = JSON.parse(body).meals;
                res.render('mealresults', { meals: meals, error: null });
            }
        });
    });

    app.get('/mealDetails/:id', function(req, res) {
        const request = require('request');
        let mealId = req.params.id;
        let url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`;
    
        request(url, function(err, response, body) {
            if (err) {
                res.render('error', { error: 'Error fetching meal details' });
            } else {
                let mealDetails = JSON.parse(body).meals[0];
                res.render('mealdetails', { meal: mealDetails });
            }
        });
    });
    
    

    
    

};