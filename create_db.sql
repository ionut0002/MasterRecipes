-- Create the database for the recipe site
CREATE DATABASE RecipeSite;
USE RecipeSite;

-- Create a table for recipes with fields for recipe name and calories
CREATE TABLE recipes (
    id INT AUTO_INCREMENT,
    name VARCHAR(100),
    calories INT unsigned,
    PRIMARY KEY(id)
);

-- Insert sample data into the recipes table
INSERT INTO recipes (name, calories) VALUES
('Spaghetti Carbonara', 500),
('Vegetable Stir Fry', 300),
('Chocolate Cake', 450);

-- Create a user for accessing the recipe site database
CREATE USER 'appuser2'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2025';

-- Grant all privileges on the recipe site database to the user
GRANT ALL PRIVILEGES ON RecipeSite.* TO 'appuser2'@'localhost';
