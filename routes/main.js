const express = require('express');
const router = express.Router();

//reference: https://stackoverflow.com/questions/70568459/how-to-use-a-second-query-in-a-promise-in-js-using-mysql-db
//set up promise
const queryPromise = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

//route to home page at localhost::3000
router.get('/', (req, res) => {
    res.render('home');
});

//route to attendee home page
router.get("/attendeeHome", async function (req, res) {
    try {
        // Start three queries concurrently
        const query1 = queryPromise("SELECT * FROM events WHERE is_published = 1 ORDER BY event_date ASC"); //get all events records in descending order
        const query2 = queryPromise("SELECT * FROM settings ORDER BY id DESC LIMIT 1;"); //get most recent settings record
        
        // Wait for all queries to complete
        const [events, settings] = await Promise.all([query1, query2]);
    
        // Render the results, page will show all events and event manager name/description from site settings
        res.render('attendeeHome', { events: events, setting: settings});
      } catch (err) {
        console.error(err); 
        res.status(500).send('An error occurred'); //alert user if there's a problem
      }
});
// original code start
//route to site settings page
router.get('/settings', (req, res) => {
    //query database and get most recent record in setings table
    db.get("SELECT * FROM settings ORDER BY id DESC LIMIT 1;", (err, result) => { 
        if (err) {
            return console.error(err.message);
        }
        if (result) {
            res.render("settings", { setting: result }); //render settings page showing result of query
        } else {
            res.status(404).send("Not Found");
        }
    });
});

//route to render create/edit events page
router.get('/events', (req, res) => {
    res.render('events');
});

//route to make changes to events using form on create/edit events page page
router.post("/events", function(req,res){
    const is_published = req.body.state === '1' ? 1 : 0;
    let sqlquery = "INSERT INTO events(title,event_description,ticket_type_full,ticket_type_discount,ticket_price_full, ticket_price_discount,event_date, is_published) VALUES(?,?,?,?,?,?,?,?)"; //query to create event record
    let newRecord = [req.body.title,req.body.event_description,req.body.ticket_type_full,req.body.ticket_type_discount,req.body.ticket_price_full,req.body.ticket_price_discount,req.body.event_date, is_published]; //get form input
    global.db.run(sqlquery,newRecord,(err,result)=>{ //insert values from form into the events table
        if(err){
            return console.error(err.message);
        }else
        res.render('events')
    });
});
//original code end

//route to organizer home page
router.get("/organizerHome", async function (req, res) {
    try {
        // Start three queries concurrently
        const query1 = queryPromise("SELECT * FROM events WHERE is_published = 1 ORDER BY id DESC"); //get all events records in descending order that are published
        const query2 = queryPromise("SELECT * FROM settings ORDER BY id DESC LIMIT 1;"); //get most recent settings record
        const query3 = queryPromise("SELECT * FROM events WHERE is_published = 0 ORDER BY id DESC"); //get all events records in descending order that are unpublished
        
        // Wait for all queries to complete
        const [published, settings, drafts] = await Promise.all([query1, query2, query3]);
    
        // Render the results on organizer home page as javascript objects
        res.render('organizerHome', { published_events: published, setting: settings, draft_events : drafts});
      } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
      }
});

//original code start
// Route to publish a draft event
router.post('/publish_event/:id', (req, res) => {
    const id = req.params.id; //save id of event

    const publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current timestamp
    // Update the event to publish it and set the published_at timestamp
    const query = `
        UPDATE events
        SET is_published = 1, publishedAt = ?
        WHERE id = ?
    `; //set to published, insert published timestamp

    db.run(query, [publishedAt, id], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).send('Error publishing event');
        }

        // Redirect to the organizer page after publishing the event
        res.redirect('/organizerHome');
    });
});

// Route to unpublish a published event
router.post('/unpublish_event/:id', (req, res) => {
    const id = req.params.id; //save event id

    db.run('UPDATE events SET is_published = 0 WHERE id = ?', [id], function(err) { //update is_published
        if (err) {
            console.log(err.message);
            return res.status(500).send('Error unpublishing event');
        }

        // Redirect to the organizer page after unpublishing the event
        res.redirect('/organizerHome');
    });
});

//route to edit button on events to pop up edit event page
router.get("/events/:id", (req, res) => {
    const id = req.params.id; //save event id
    db.get("SELECT * FROM events WHERE id = ?", [id], (err, result) => { //get event record that has saved id
        if (err) {
            return console.error(err.message);
        }
        if (result) {
            res.render("editEvent", { event: result }); //populate form fields with event information using javascript object
        } else { 
            res.status(404).send("Error");
        }
    });
});

//route to update pages
router.post("/update/:id", (req, res) => {
    const id = req.params.id; //save event id
    const { title, event_description, event_date, ticket_type_full, ticket_type_discount, ticket_price_full, ticket_price_discount} = req.body; //save new form inputs
    const modAt = new Date().toISOString().slice(0, 19).replace('T', ' '); //save modified at date
    const query = `
    UPDATE events SET title = ?, event_description = ? ,
     event_date = ?, ticket_type_full = ?, ticket_type_discount = ?,
      ticket_price_full = ?, ticket_price_discount = ?, modifiedAt = ? WHERE id = ?
`; //update the event record that has the saved id and at modified at time

db.run(query, [title, event_description, event_date, ticket_type_full,ticket_type_discount, ticket_price_full,ticket_price_discount, modAt, id], function(err) {
    if (err) {
        console.error(err);
        return res.status(500).send('Error publishing event');
    }

    // Redirect to the organizer page after updating the event
    res.redirect('/organizerHome');
});
});

//route for delete button
router.post("/delete/:id", (req, res) => {
    const id = req.params.id; //save event id
    db.run("DELETE FROM events WHERE id = ?", [id], (err) => { //remove the record that has that id in the events table
        if (err) {
            return console.error(err.message);
        }
        res.redirect('/organizerHome'); //redirect to organizer home page after deletion
    });
});
//original code end

//route to attendee event page where attendees can book 
router.get("/eventDetails/:id", (req, res) => {
    const id = req.params.id; //save id of event
    db.get("SELECT * FROM events WHERE id = ?", [id], (err, result) => { //select all columns for the record in events with that id
        if (err) {
            return console.error(err.message);
        }
        //reference: https://stackoverflow.com/questions/40528557/how-does-array-fromlength-5-v-i-i-work
        if (result) {
            res.render("eventDetails", { event: result, fullTicketOptions: Array.from({ length: result.ticket_type_full }, (_, i) => i + 1), //create the array for the full pricce ticket drop down and the javascript object of the event
                                                    discountTicketOptions: Array.from({ length: result.ticket_type_discount }, (_, i) => i + 1)}); //create the array for the discount pricce ticket drop down
        } else {
            res.status(404).send("Event Not Found");
        }
    });
});

//route for book button
router.post('/book/:id', (req, res) => {
    const id = req.params.id; //save id of event
    const fullPriceAmount = req.body.ticket_type_full; //save amount of full price tickets requested
    const discountPriceAmount = req.body.ticket_type_discount; //save amount of discount price tickets requested

    if (fullPriceAmount == 0 & discountPriceAmount == 0) //if attendee has selected no tickets send error with back button
    {
        //reference: https://stackoverflow.com/questions/8067510/onclick-javascript-to-make-browser-go-back-to-previous-page
        return res.status(400).send(`
            <html>
                <body>
                    <h3>Error: You must select at least one ticket!</h3>
                    <button onclick="window.history.back()">Go Back</button>
                </body>
            </html>
        `);
    }
    else {

    //query for events to set ticket amounts equal to amounts - the tickets the users just purchased
    const sqlquery = `
        UPDATE events SET ticket_type_full = ticket_type_full - ?, 
        ticket_type_discount = ticket_type_discount - ? WHERE id = ?
    `;

    //reference: https://stackoverflow.com/questions/53299322/transactions-in-node-sqlite3
    // Start the transaction on both databases
    db.serialize(() => {
        // start transaction
        db.run("BEGIN TRANSACTION");

        // update ticket count in events table
        db.run(sqlquery, [fullPriceAmount, discountPriceAmount, id], (err) => {
            if (err) {
                db.run("ROLLBACK"); // Rollback if there's an error
                console.error(err);
                return res.status(500).send('Error updating ticket count');
            }

            //insert booking details into bookings table using input from form
            const bookingQuery = `
                INSERT INTO bookings (attendee_name, ticket_amount_full, ticket_amount_discount, title) 
                VALUES (?, ?, ?, ?)
            `;

            db.run(bookingQuery, [req.body.attendee_name, fullPriceAmount, discountPriceAmount, req.body.title], function (err) {
                if (err) {
                    db.run("ROLLBACK"); // Rollback if there's an error
                    console.error(err);
                    return res.status(500).send('Error inserting booking data');
                }

                //commit the transaction if everything is successful
                db.run("COMMIT");

                // Redirect to attendee home page
                res.redirect('/attendeeHome');
            });
        });
    });
}
});

//start original code
//route to site settings page
router.post("/settings", function(req,res){
    let sqlquery = "INSERT INTO settings(title,manager_name,settings_description) VALUES(?,?,?)"; //query to add new record to settings table

    let newRecord = [req.body.title,req.body.manager_name,req.body.settings_description]; //use the form values from the request
    db.run(sqlquery,newRecord,(err,result)=>{
        if(err){
            return console.error(err.message);
        }else
        res.redirect('organizerHome'); //redirect to home page after changing settings
    });
});

//route to attendee Home page
router.get("/bookings", function (req, res) {
    // query the bookings database to get all records in the bookings table, ordered by id descending  so most recent first
    let sqlquery = "SELECT * FROM bookings ORDER BY id DESC"; 

    // Execute SQL query
    global.db.all(sqlquery, (err, result) => {
        if (err) {
            return console.log(err.message);
        }
        
        // render the bookings page with javascript object of query result
        res.render("bookings", { booking: result });
    });
});

module.exports = router;
//end original code