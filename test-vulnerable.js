// Test file with obvious security vulnerabilities
const express = require('express');
const app = express();

// Vulnerability 1: SQL Injection
app.get('/users', (req, res) => {
    const query = `SELECT * FROM users WHERE id = ${req.query.id}`;
    db.query(query, (err, results) => {
        res.json(results);
    });
});

// Vulnerability 2: Command Injection
app.post('/exec', (req, res) => {
    const cmd = req.body.command;
    require('child_process').exec(cmd, (error, stdout) => {
        res.send(stdout);
    });
});

// Vulnerability 3: XSS
app.get('/search', (req, res) => {
    const searchTerm = req.query.q;
    res.send(`<h1>Results for: ${searchTerm}</h1>`);
});

// Vulnerability 4: Path Traversal
app.get('/file', (req, res) => {
    const filePath = req.query.path;
    res.sendFile(filePath);
});

// Vulnerability 5: Hardcoded credentials
const API_KEY = "sk-1234567890abcdef";
const DB_PASSWORD = "admin123";

app.listen(3000);