require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('knex')(require('./knexfile').development);
const UsersModel = require('./models/user_model');
const { de } = require('faker/lib/locales');
app.post(
    '/users/login',
    bodyParser.json(),
    async (req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        if(!username || !password) {
            res.status(400).json({message: 'Username and password required'});
        }
        const user = await knex('users').where('username', username).first();
        console.log(`password is ${password} and user.password is ${user.password} and user is ${user.username}`);
        if(!user) {
            res.status(401).json({message: 'Invalid username or password'});
        }
        const match = await bcrypt.compare(password, user.password);
        if(!match) {
            res.status(401).json({message: 'Invalid username or password'});
        }
        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET);
        delete user.password;
        delete user.id;
        res.json({token: token, user: user});
    }
);

// Middleware for JWT authentication
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
  
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed. Token missing.' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Authentication failed. Invalid token.' });
      }
      req.user = user;
      next();
    });
  };

app.get('/users', authenticateJWT,async (req, res) => {
    const users = await knex('users').select('id', 'name', 'email', 'username');
    const sanitizedUsers = users.map((user) => {
        const { password, id, ...rest } = user;
        return rest;
      });
      res.json(sanitizedUsers);
});

app.get('/users/:uuid', authenticateJWT, async (req, res) => {
    const uuid = req.params.uuid;
    const user = await knex('users').where('uuid', uuid).first();
    if(!user) {
        res.status(404).json({message: 'User not found'});
    }
    delete user.password;
    delete user.id;
    res.json(user);
});

app.get('/users/me', authenticateJWT, async (req, res) => {
    const currentUser = await knex('users').where('id', req.user.id).first();
    if(!currentUser) {
        res.status(404).json({message: 'User not found'});
    }
    delete currentUser.password;
    delete currentUser.id;
    res.json(currentUser);
});

app.listen(port, () => {
    console.log(`Authentication service listening on port ${port}`);
    }
);