// Built-in Node.js modules
let fs = require("fs");
let path = require("path");

// NPM modules
let express = require("express");
let axios = require("axios");
let sqlite3 = require("sqlite3");
let cors = require("cors");
const { parseArgs } = require("util");
let db_filename = path.join(__dirname, "db", "stpaul_crime.sqlite3");
let public_dir = path.join(__dirname, "public");

let app = express();
let port = 8000;
app.use(cors());

let SQLquery = "";

app.use(express.json());

// Open SQLite3 database (in read-only mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.log("Error opening " + path.basename(db_filename));
  } else {
    console.log("Now connected to " + path.basename(db_filename));
  }
});

app.use(express.static(public_dir));
// GET request handler for home page
app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  console.log("home");
  fs.readFile(path.join(public_dir, "index.html"), "utf-8", (err, page) => {
    if (err) {
      res.status(404).send("Error: File Not Found");
    } else {
      res.status(200).type("html").send(page);
    }
  });
});

// GET request handler for crime codes
app.get("/codes", (req, res) => {
  SQLquery = "SELECT code, incident_type AS type FROM codes ";
  console.log(req.query); // query object (key-value pairs after the ? in the url)
  //need if statement for certain codes
  let params = [];
  clause = "WHERE";
  if (req.query.hasOwnProperty("code")) {
    let codearray = req.query.code.split(",");
    SQLquery = SQLquery + clause + " code IN ( ?";
    //loops through multiple codes
    let i;
    let between = "";
    for (i = 0; i < codearray.length; i++) {
      params.push(parseInt(codearray[i]));
      SQLquery = SQLquery + between;
      between = ",? ";
    }
    console.log(SQLquery);
    SQLquery = SQLquery + ")";
    clause = "AND";
  }
  SQLquery = SQLquery + " ORDER BY code ";
  db.all(SQLquery, params, (err, rows) => {
    res.status(200).type("json").send(rows);
  });
});

// GET request handler for neighborhoods
app.get("/neighborhoods", (req, res) => {
  let query = req.query;
  let sql = "SELECT * FROM Neighborhoods";
  let params = [];

  if ("id" in query) {
    sql += " WHERE neighborhood_number = ?";
    params = query.id.split(",");
    for (let i = 1; i < params.length; i++) {
      sql += " OR neighborhood_number = ?";
    }
  }

  databaseSelect(sql, params).then((data) => {
    res.status(200).type("json").send(data);
  });
});

// GET request handler for crime incidents
app.get("/incidents", (req, res) => {
  console.log(req.query); // query object (key-value pairs after the ? in the url)
  let p, q;
  p = [];
  let query = req.query;
  let second = false;
  console.log(query);

  // Initialize the query string with a SELECT statement
  q = "SELECT * FROM Incidents";

  // Add a WHERE clause for the code parameter, if it exists
  if ("code" in query) {
    if (second) {
      q += " AND";
    } else {
      q += " WHERE";
      second = true;
    }
    let t = query.code.split(",");
    t.forEach((element) => p.push(element));
    q += " (code = ?";
    for (let i = 1; i < t.length; i++) {
      q += " OR code = ?";
    }
    q += ")";
  }

  // Add a WHERE clause for the neighborhood parameter, if it exists
  if ("neighborhood" in query) {
    if (second) {
      q += " AND";
    } else {
      q += " WHERE";
      second = true;
    }
    let t = query.neighborhood.split(",");
    t.forEach((element) => p.push(element));
    q += " (neighborhood_number = ?";
    for (let i = 1; i < t.length; i++) {
      q += " OR neighborhood_number = ?";
    }
    q += ")";
  }

  // Add a WHERE clause for the grid parameter, if it exists
  if ("grid" in query) {
    if (second) {
      q += " AND";
    } else {
      q += " WHERE";
      second = true;
    }
    let t = query.grid.split(",");
    t.forEach((element) => p.push(element));
    q += " (police_grid = ?";
    for (let i = 1; i < t.length; i++) {
      q += " OR police_grid = ?";
    }
    q += ")";
  }

  // Add a WHERE clause for the start_date parameter, if it exists
  if ("start_date" in query) {
    if (second) {
      q += " AND";
    } else {
      q += " WHERE";
      second = true;
    }
    let t = query.start_date;
    p.push(t);
    q += " date(date_time) >= ?";
  }

  // Add a WHERE clause for the end_date parameter, if it exists
  if ("end_date" in query) {
    if (second) {
      q += " AND";
    } else {
      q += " WHERE";
      second = true;
    }
    let t = query.end_date;
    p.push(t);
    q += " date(date_time) <= ?";
  }

  // Add an ORDER BY clause to the query
  q += " ORDER BY date_time DESC";

  // Add a LIMIT clause to the query, using the limit parameter if it exists, or a default value of 1000
  if ("limit" in query) {
    q += " LIMIT ?";
    p.push(query.limit);
  } else {
    q += " LIMIT 1000";
  }

  // Execute the query and handle the response
  databaseSelect(q, p).then((data) => {
    // Split the date_time field into separate date and time fields, then delete the date_time field
    data.forEach((element) => {
      date_time = element.date_time.split("T");
      element.date = date_time[0];
      element.time = date_time[1];
      delete element.date_time;
    });
    res.status(200).type("json").send(data);
  });
});

// PUT request handler for new crime incident
app.put("/new-incident", (req, res) => {
  console.log(req.body); // uploaded data

  let case_number = req.body.case_number;
  let date_time = req.body.date + "T" + req.body.time;
  let code = req.body.code;
  let incident = req.body.incident;
  let police_grid = req.body.police_grid;
  let neighborhood_number = req.body.neighborhood_number;
  let block = req.body.block;

  if (
    case_number == undefined ||
    req.body.date == undefined ||
    req.body.time == undefined ||
    code == undefined ||
    incident == undefined ||
    police_grid == undefined ||
    neighborhood_number == undefined ||
    block == undefined
  ) {
    res.status(500).type("txt").send("Missing parameters.");
    console.log("Parameter failure.");
  } else {
    let params = [];

    params.push(case_number);
    params.push(date_time);
    params.push(code);
    params.push(incident);
    params.push(police_grid);
    params.push(neighborhood_number);
    params.push(block);

    let query =
      "INSERT INTO Incidents (case_number, date_time, code, incident,police_grid, neighborhood_number, block) VALUES (?, ?, ?, ?, ?, ?, ?)";

    db.run(query, params, (err, rows) => {
      if (
        err ==
        "Error: SQLITE_CONSTRAINT: UNIQUE constraint failed: Incidents.case_number"
      ) {
        res.status(500).type("txt").send("Case number already found.");
      } else if (err) {
        res.status(500).type("txt").send("Server request failed.");
      } else {
        res.status(200).type("txt").send("Added case number.");
      }
    });
  }
});

// DELETE request handler for new crime incident
app.delete("/remove-incident", (req, res) => {
  params = [];
  console.log(req.body); // uploaded data
  SQLcheck = "SELECT case_number FROM Incidents WHERE case_number = ?"; //first we should check if this is null
  SQLquery = "DELETE FROM Incidents WHERE case_number = ?";

  if (req.body.hasOwnProperty("case_number")) {
    params.push(req.body.case_number);
  }

  db.all(SQLcheck, params, (err, rows) => {
    if (rows.length === 0) {
      res.status(500).type("txt").send("Case number not found.");
    } else {
      db.run(SQLquery, params, (err, res2) => {
        res.status(200).type("txt").send("Deleted case number.");
      });
    }
  });
});

app.get("/nominatim", (req, res) => {
  // Make a GET request to the Nominatim API to convert the location to latitude and longitude coordinates
  axios
    .get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: req.query.location,
        format: "json",
      },
    })
    .then((response) => {
      // Check if the API returned any results
      if (response.data.length > 0) {
        // Extract the latitude and longitude coordinates from the API response
        const lat = response.data[0].lat;
        const lng = response.data[0].lon;

        // Return the coordinates in the response
        res.send({
          lat: lat,
          lng: lng,
        });
      } else {
        // Return an error if no results were returned
        res.status(400).send({
          error: "No results found",
        });
      }
    })
    .catch((error) => {
      console.log(error);
    });
});

// Create Promise for SQLite3 database SELECT query
function databaseSelect(query, params) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Create Promise for SQLite3 database INSERT or DELETE query
function databaseRun(query, params) {
  return new Promise((resolve, reject) => {
    db.run(query, params, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Start server - listen for client connections
app.listen(port, () => {
  console.log("Now listening on port " + port);
});
