const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const { name } = require('ejs');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
   // host: 'localhost',
   // user: 'root',
   // password: '',
   // database:'c237_busticketapp'
   host: 'db4free.net',
   user: 'busticketapp',
   password: 'busticketapp',
   database: 'busticketapp'
});

connection.connect((err) => {
    if (err)
    {
        console.error('Error connecting to MySQL:', err)
        return;
    }
    console.log('Connected to MySQL database');
});

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.get('/', function(req, res)
{
    const sql = 'SELECT * FROM images';
    connection.query( sql, (error, results) => {
        if (error)
        {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving image');
        }
        res.render('index', { images: results});
    });
});
app.get('/contact', function(req, res)
{
    res.render('contact');
});
app.get('/warning', function(req, res)
{
    res.render('warning');
});

app.post('/submit', function(req, res)
{
    const { title, name, email, contact, comments } = req.body;
    res.render('submit', { title, name, email, contact, comments });
});

app.get('/ticketList', function(req, res)
{
    const sql = 'SELECT ticket.*, lf.locationName AS fromName, lt.locationName AS toName FROM ticket INNER JOIN location lf ON ticket.fromID = lf.locationID INNER JOIN location lt ON ticket.toID = lt.locationID WHERE date >= CURDATE() ORDER BY date, time';
    connection.query( sql, (error, results) => {
        if (error)
        {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving ticket');
        }
        res.render('ticketList', { tickets: results});
    });
});

app.get('/ticket/:id', function(req, res)
{
    const ticketId = req.params.id;
    const sql = 'SELECT ticket.*, lf.locationName AS fromName, lt.locationName AS toName FROM ticket INNER JOIN location lf ON ticket.fromID = lf.locationID INNER JOIN location lt ON ticket.toID = lt.locationID WHERE ticketID = ?';

    connection.query( sql, [ticketId], (error, results) => {
        if (error)
        {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving ticket by ID');
        }

        if (results.length > 0)
        {
            res.render('ticketInfo', { ticket: results[0] });
        }
        else
        {
            res.status(404).send('Ticket not found');
        }
    });
});

app.get('/bookTicketForm', (req, res) =>
{
    const sql = 'SELECT * FROM location ORDER BY locationName';
    connection.query( sql, (error, results) => {
        if (error)
        {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving location');
        }
    res.render('bookTicket', { location: results });
    });
});

app.post('/tickets', function(req, res)
{
   const { from, to, date, time } = req.body;
   const sql = 'INSERT INTO ticket (fromID, toID, date, time) VALUES (?, ?, ?, ?)';

   if (from === to || (new Date(date) <= new Date()))
   {
        res.redirect('/warning');
   }

   else
   {
    connection.query( sql, [from, to, date, time], (error, results) => {
        if (error)
        {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error booking ticket');
        }
        
        else 
        {
            res.redirect('/ticketList');
        }
    });
   }

});

app.get('/ticket/:id/update', function(req, res)
{
    const ticketId = req.params.id;
    const sqlTicket = 'SELECT ticket.*, lf.locationName AS fromName, lt.locationName AS toName FROM ticket INNER JOIN location lf ON ticket.fromID = lf.locationID INNER JOIN location lt ON ticket.toID = lt.locationID WHERE ticketID = ?';
    const sqlLocation = 'SELECT * FROM location ORDER BY locationName';
    connection.query( sqlTicket, [ticketId], (ticketError, ticketResults) => {
        if (ticketError)
        {
            console.error('Database query error:', ticketError.message);
            return res.status(500).send('Error retrieving ticket by ID');
        }

        if (ticketResults.length > 0)
        {
            connection.query( sqlLocation, (locationError, locationResults) => {
                if (locationError)
                {
                    console.error('Database query error:', locationError.message);
                    return res.status(500).send('Error retrieving location');
                }
                res.render('updateTicket', { ticket: ticketResults[0], location: locationResults });
            });
        }
        else
        {
            res.status(404).send('Ticket not found');
        }
    });
});

app.post('/ticket/:id/update', function(req, res)
{
    const ticketId = parseInt(req.params.id);
    const {from, to, date, time} = req.body;
    const sql = 'UPDATE ticket SET fromID = ?, toID = ?, date = ?, time = ? WHERE ticketID = ?';

    if (from === to || (new Date(date) <= new Date()))
    {
         res.redirect('/warning');
    }

    else
    {
        connection.query( sql, [from, to, date, time, ticketId], (error, results) => {
            if (error)
            {
                console.error('Database query error:', error.message);
                return res.status(500).send('Error updating ticket');
            }
            else
            {
                res.redirect('/ticketList');
            }
        });
    }
});

app.get('/ticket/:id/delete', (req, res) => {
    const ticketId = req.params.id;
    const sql = 'DELETE FROM ticket WHERE ticketID = ?';

    connection.query( sql, [ticketId], (error, results) => {
        if (error)
        {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error cancelling ticket by ID');
        }
        else
        {
            res.redirect('/ticketList');
        }

    });
});

app.listen(PORT, () =>
{
    console.log(`Server is running at http://localhost:${PORT}`);
});