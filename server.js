/////////////////////
//////Global Definations//////////
/////////////////////

const adminName = "Neha";
// const adminPassword = "1234";
const adminPassword =
  "$2b$12$yAUN.mxvcNM4WdxVxXgdBO1vfT4piPuaE510EQeJuMiq1jf/xXAUi";

/////////////////////
//////packages//////////
/////////////////////

const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const port = 8080;
const { engine } = require("express-handlebars");
const session = require(`express-session`);
const connectSqlite3 = require("connect-sqlite3");

//databasefile
const dbFile = "my-project-data.sqlite3.db";
db = new sqlite3.Database(dbFile);

/////////////////////
//////sessions//////////
/////////////////////

const SQliteStore = connectSqlite3(session);

app.use(
  session({
    store: new SQliteStore({ db: "session-db.db" }),
    saveUninitialized: false,
    resave: false,
    secret: "This123Is@Another#456GreatSecret678%Sentence",
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  next();
});

app.use((req, res, next) => {
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  next();
});
27;

///to hash the password
const bcrypt = require("bcrypt");
const saltRounds = 12;

///////////////////////////////////////////
// // /code to genrate hashed password//////
////////////////////////////////////

// bcrypt.hash("1234", saltRounds, function (err, hash) {
//   if (err) {
//     console.log("error encrypting the password:", err);
//   } else {
//     console.log("hashed password:", hash);
//   }
// });

/////////////////////
//////handlebars//////////
/////////////////////

app.engine(
  "handlebars",
  engine({
    helpers: {
      eq(a, b) {
        return a == b;
      },
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", "./views");

//MIDDLEWARES
app.use(express.urlencoded({ extended: true })); // to process forms sent using the post method
//define the public directory as static
app.use(express.static("public"));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

/////////////////////
//////Routes//////////
/////////////////////

app.get("/", function (req, res) {
  const model = {
    isLoggedIn: req.session.isLoggedIn,
    name: req.session.name,
    isAdmin: req.session.isAdmin,
    user: req.session.user,
  };
  res.render("home.handlebars", model);
});

app.get("/about", function (req, res) {
  // console.log("I received a new request,I am sending the response...");
  res.render("about_us.handlebars");
});

//// to register the users
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { username, password, name, phonenumber, email } = req.body;

  const hash = await bcrypt.hash(password, 14);

  db.run(
    "INSERT INTO users (username, password,name,phonenumber,email) VALUES (?, ?,?,?,?)",
    [username, hash, name, phonenumber, email],
    (err) => {
      if (err) {
        console.error("Error inserting user into database:", err);
        res.status(500).send("Server error");
      } else {
        res.redirect("/login");
      }
    }
  );
});

app.get("/login", function (req, res) {
  console.log("I received a new request on login,I am sending the response...");
  res.render("login.handlebars");
});

app.get("/logout", (req, res) => {
  // logout function
  req.session.destroy((err) => {
    // destroy the current session
    if (err) {
      console.log("Error while destroying the session: ", err);
    } else {
      console.log("Logged out...");
      res.redirect("/");
    }
  });
});

app.get("/events/new", function (req, res) {
  res.render("event-new.handlebars");
});

app.post("/events/new", function (req, res) {
  const name = req.body.eventname;
  const description = req.body.eventdesc;
  const date = req.body.eventdate;
  const place = req.body.eventplace;
  const time = req.body.eventtime;

  db.run(
    `INSERT INTO events (ename, edesc, edate, etime, eplace) VALUES (?, ?, ?, ?, ?)`,
    [name, description, date, time, place],
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
        res.redirect("/events");
      } else {
        console.log("Line added into the events table!");
        res.redirect("/events");
      }
    }
  );
});

app.get("/events", function (req, res) {
  const page = req.query.page || 1;
  const limit = 3;
  const offset = (page - 1) * limit;
  let nextPage = parseInt(page) + 1;
  let previousPage = parseInt(page) - 1;

  const countQuery = `SELECT COUNT(eid) AS total FROM events`;

  db.get(countQuery, [], (error, sum) => {
    if (error) {
      console.log("There is an error running the count query");
    } else {
      const totalEvents = sum.total;
      const numberOfEventId = Math.ceil(totalEvents / limit);
      console.log(`Total number of events:` + JSON.stringify(sum));
      if (nextPage > numberOfEventId) {
        nextPage = null;
      } else if (previousPage < 0) {
        previousPage = null;
      }
    }
  });

  const query = `SELECT * FROM events LIMIT? OFFSET?`;

  db.all(query, [limit, offset], (error, listofprojects) => {
    if (error) {
      console.log("ERROR:", error);
    } else {
      model = {
        events: listofprojects,
        page: parseInt(page),
        nextPage,
        previousPage,
      };
      res.render("eventdetails.handlebars", model);
    }
  });
});

app.get("/events/modify/:eid", function (req, res) {
  const myeid = req.params.eid;
  db.get(`SELECT * FROM events WHERE eid=?`, [myeid], (error, theEvent) => {
    if (error) {
      console.log("ERROR:", error);
      res.redirect("/events");
    } else {
      model = { events: theEvent };
      res.render("event-new.handlebars", model);
    }
  });
});

app.post("/events/modify/:eid", function (req, res) {
  const name = req.body.eventname;
  const description = req.body.eventdesc;
  const date = req.body.eventdate;
  const place = req.body.eventplace;
  const time = req.body.eventtime;
  const id = req.params.eid;

  db.run(
    `UPDATE events SET ename =?, edesc =?, edate =?, etime=?, eplace=? WHERE eid=? `,
    [name, description, date, time, place, id],
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
        res.redirect("/events");
      } else {
        res.redirect("/events");
      }
    }
  );
});

app.get("/partners", function (req, res) {
  db.all("SELECT*FROM partners", (error, listOfPartners) => {
    if (error) {
      console.log("ERROR:", error);
    } else {
      model = { partners: listOfPartners };
      res.render("partners.handlebars", model);
    }
  });
});

app.get("/users/new", function (req, res) {
  res.render("users-new.handlebars");
});

app.post("/users/new", async function (req, res) {
  const { username, name, phonenumber, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  db.run(
    `INSERT INTO users (username, name, phonenumber, email,password) VALUES(?,?,?,?,?) `,
    [username, name, phonenumber, email, password],
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
        res.redirect("/users");
      } else {
        console.log("New user added into users table!");
        res.redirect("/users");
      }
    }
  );
});

app.get("/users", function (req, res) {
  db.all("SELECT*FROM users", (error, listOfUsers) => {
    if (error) {
      console.log("ERROR:", error);
    }
    if (req.session.isAdmin) {
      model = { users: listOfUsers };
      res.render("users.handlebars", model);
    } else {
      res.render("404.handlebars");
    }
  });
});

app.get("/users/delete/:userid", function (req, res) {
  const myuserid = req.params.userid;
  db.run(
    `DELETE FROM users WHERE userid=?`,
    [myuserid],
    (error, deleteEvent) => {
      if (error) {
        console.log("ERROR:", error);
      } else {
        console.log("deleteEvent: " + req.params.userid + "has been deleted");

        res.redirect(`/users`);
      }
    }
  );
});

app.get("/users/modify/:userid", function (req, res) {
  const myuserid = req.params.userid;
  db.get(
    `SELECT * FROM users WHERE userid=?`,
    [myuserid],
    (error, theUsers) => {
      if (error) {
        console.log("ERROR:", error);
        res.redirect("/users");
      } else {
        model = { users: theUsers };
        res.render("users-new.handlebars", model);
      }
    }
  );
});

app.post("/users/modify/:userid", function (req, res) {
  const { username, name, phonenumber, email, password } = req.body;
  const myuserid = req.params.userid;
  db.run(
    `UPDATE users SET name =?, email =?, phonenumber=?,username =?, password=? WHERE userid=? `,
    [name, email, phonenumber, username, password, myuserid],
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
        res.redirect("/users");
      } else {
        res.redirect("/users");
      }
    }
  );
});

app.get(`/speakers`, function (req, res) {
  db.all("SELECT * FROM speakers", (error, listOfSpeakers) => {
    if (error) {
      console.log("ERROR:", error);
    } else {
      // console.log("SPEAKERS: " + JSON.stringify(listOfSpeakers));
      model = { speakers: listOfSpeakers };
      res.render(`speakers.handlebars`, model);
    }
  });
});

app.get("/events/:eid", function (req, res) {
  const myeid = req.params.eid;
  db.all(
    `SELECT * FROM events
    JOIN eventsandspeakers
    ON events.eid = eventsandspeakers.event_id 
    JOIN speakers 
    ON eventsandspeakers.speaker_id = speakers.sid 
    Where events.eid=?`,
    [myeid],
    (error, listOfSpeakersAndEvents) => {
      if (error) {
        console.log("ERROR:", error);
      } else {
        console.log("EHS: " + JSON.stringify(listOfSpeakersAndEvents));
        model = { eventsandspeakers: listOfSpeakersAndEvents };
        res.render(`eventandspeaker.handlebars`, model);
      }
    }
  );
});

app.get("/events/delete/:eid", function (req, res) {
  const myeid = req.params.eid;
  db.run(`DELETE FROM events Where eid=?`, [myeid], (error, deleteEvent) => {
    if (error) {
      console.log("ERROR:", error);
    } else {
      console.log("deleteEvent: " + req.params.eid + "has been deleted");

      res.redirect(`/events`);
    }
  });
});

/////////////////////
//////Login post form//////////
/////////////////////

app.post("/login", (req, res) => {
  console.log("I am in the route /login in POST");
  const { username, password } = req.body;
  // console.log("----> ", username, " ", password, " ", adminPassword);

  // Verification steps
  if (!username || !password) {
    const model = { error: "Username and password are required", message: "" };
    return res.status(400).render("login.handlebars", model);
  }

  // Check if the username is admin
  if (username == adminName) {
    // Admin login logic
    bcrypt.compare(password, adminPassword, (err, result) => {
      if (err) {
        const model = {
          error: "Error while comparing passwords: " + err,
          message: "",
        };
        return res.render("login.handlebars", model);
      }

      if (result) {
        console.log(`The password is the admin one!`);

        req.session.isAdmin = true;
        req.session.isLoggedIn = true;
        req.session.name = username;
        return res.redirect("/"); // Admin login successful
      } else {
        const model = {
          error: `Sorry, the password for ${username} is incorrect...`,
          message: "",
        };
        return res.status(400).render("login.handlebars", model); // Wrong admin password
      }
    });
  } else {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      async (err, user) => {
        if (err) {
          const model = { error: "Server error", message: "" };
          return res.status(500).render("login.handlebars", model);
        }

        if (!user) {
          const model = { error: "User not found!", message: "" };
          return res.status(401).render("login.handlebars", model); // User not found
        }

        const result = await bcrypt.compare(password, user.password);
        if (result) {
          console.log(`The password is user one!`);
          req.session.user = user;
          req.session.isAdmin = false;
          req.session.isLoggedIn = true;
          req.session.name = username;
          return res.redirect("/");
        } else {
          const model = { error: "Wrong password", message: "" };
          return res.status(401).render("login.handlebars", model); // Wrong password
        }
      }
    );
  }
});

//////////////////////////////////////////
// 404 Not Found Error Handler
//////////////////////////////////////////

app.use((req, res) => {
  res.status(404).render("404.handlebars");
});

//////////////////////////////////////////
// 505  Error Handler
//////////////////////////////////////////

app.use((err, req, res, next) => {
  console.error("Server Error: ", err.stack);
  res.status(500).render("500.handlebars");
});

/////////////////////
//////listen//////////
/////////////////////

//make the server listen to connections
app.listen(port, function () {
  // initTableEvents(db);
  // initTableSpeakers(db);
  // initTablePartners(db);
  // initTableEventsAndSpeakers(db);
  db.run(
    "CREATE TABLE IF NOT EXISTS users (userid INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,username TEXT NOT NULL, password TEXT NOT NULL, email TEXT NOT NULL,phonenumber TEXT)"
  );
  console.log(`Server is listening on port ${port}...`);
});

/////////////////////
//////Database//////////
/////////////////////

function initTableEvents(mydb) {
  const events = [
    {
      id: "1",
      name: "Future of AI",
      desc: "Experts like Andrew Ng and Fei-Fei Li will discuss the future advancements in artificial intelligence, touching on ethical considerations, cutting-edge innovations, and real-world applications in industries like healthcare and finance.",
      date: "October 10",
      time: "10:00am-1:00pm",
      place: "Lisbon",
    },
    {
      id: "2",
      name: "Blockchain Revolution",
      desc: "Join Vitalik Buterin and other blockchain pioneers as they discuss the decentralized future and the transformative power of blockchain technology across sectors like finance, supply chain, and governance.",
      date: "October 12",
      time: "2:00pm-5:00pm",
      place: "Lisbon",
    },
    {
      id: "3",
      name: "Quantum Computing Explained",
      desc: "Discover the potential of quantum computing from industry leaders. Learn how this revolutionary technology is set to disrupt data processing, cryptography, and more.",
      date: "October 15",
      time: "11:00am-2:00pm",
      place: "Lisbon",
    },
    {
      id: "4",
      name: "Cybersecurity in the Modern World",
      desc: "Industry experts will share insights on the latest trends and threats in cybersecurity, and how organizations can defend against sophisticated cyberattacks.",
      date: "October 18",
      time: "3:00pm-6:00pm",
      place: "Lisbon",
    },
    {
      id: "5",
      name: "Green Tech and Sustainability",
      desc: "A discussion on how technology is being used to tackle climate change, with key speakers from renewable energy companies and environmental agencies.",
      date: "October 20",
      time: "1:00pm-4:00pm",
      place: "Lisbon",
    },
    {
      id: "6",
      name: "The Metaverse: Virtual Worlds and Beyond",
      desc: "A deep dive into the metaverse, its current state, and its future potential. Learn how virtual worlds are changing social interaction, gaming, and business.",
      date: "October 22",
      time: "9:00am-12:00pm",
      place: "Lisbon",
    },
    {
      id: "7",
      name: "Ethical AI and Data Privacy",
      desc: "An important discussion on ethical AI and the importance of data privacy as AI technologies become more ingrained in our lives. Experts will weigh in on global standards and regulations.",
      date: "October 25",
      time: "2:00pm-5:00pm",
      place: "Lisbon",
    },
    {
      id: "8",
      name: "The Future of 5G Networks",
      desc: "Explore the deployment of 5G technology with industry leaders, and how it will accelerate innovations in IoT, smart cities, and autonomous vehicles.",
      date: "October 27",
      time: "11:00am-2:00pm",
      place: "Lisbon",
    },
    {
      id: "9",
      name: "AR/VR Innovations in Healthcare",
      desc: "A discussion on how augmented and virtual reality are transforming healthcare, with a focus on patient care, surgery, and medical training.",
      date: "October 29",
      time: "10:00am-1:00pm",
      place: "Lisbon",
    },
    {
      id: "10",
      name: "FinTech Disruption",
      desc: "Join this event to understand the latest trends in financial technology, including digital banking, blockchain-based payments, and decentralized finance.",
      date: "November 1",
      time: "3:00pm-6:00pm",
      place: "Lisbon",
    },
    {
      id: "11",
      name: "AI in Autonomous Vehicles",
      desc: "Discover how artificial intelligence is advancing self-driving car technologies, featuring discussions on safety, regulation, and commercial applications.",
      date: "November 3",
      time: "1:00pm-4:00pm",
      place: "Lisbon",
    },
    {
      id: "12",
      name: "Robotics and Automation",
      desc: "This event will showcase the future of robotics, its role in manufacturing, healthcare, and beyond. Industry leaders will discuss innovations and ethical implications.",
      date: "November 5",
      time: "2:00pm-5:00pm",
      place: "Lisbon",
    },
    {
      id: "13",
      name: "Digital Transformation in Business",
      desc: "A look into how businesses are leveraging digital transformation strategies to improve efficiency, customer experiences, and innovation.",
      date: "November 7",
      time: "9:00am-12:00pm",
      place: "Lisbon",
    },
    {
      id: "14",
      name: "Space Tech and Exploration",
      desc: "A thrilling discussion on the future of space exploration, featuring speakers from top space agencies and private space ventures, covering Mars exploration, satellites, and more.",
      date: "November 9",
      time: "3:00pm-6:00pm",
      place: "Lisbon",
    },
  ];

  mydb.run(
    `CREATE TABLE events (
      eid INTEGER PRIMARY KEY AUTOINCREMENT, 
      ename TEXT NOT NULL, 
      edesc TEXT NOT NULL, 
      edate TEXT NOT NULL, 
      etime TEXT NOT NULL, 
      eplace TEXT NOT NULL
      
    )`,
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("---> Table events created!");

        events.forEach((oneEvent) => {
          mydb.run(
            `INSERT INTO events (ename, edesc, edate, etime, eplace) VALUES (?, ?, ?, ?, ?)`,
            [
              oneEvent.name,
              oneEvent.desc,
              oneEvent.date,
              oneEvent.time,
              oneEvent.place,
            ],
            (error) => {
              if (error) {
                console.log("ERROR: ", error);
              } else {
                console.log("Line added into the events table!");
              }
            }
          );
        });
      }
    }
  );
}

function initTableSpeakers(mydb) {
  // photos generated using canva AI"https://www.canva.com/design/DAGS-mF-zxQ/jMZuTWyGiGRPva-Xf6233g/edit?ui=eyJFIjp7IkE_IjoiViIsIkIiOiJCIn0sIkciOnsiQiI6dHJ1ZX19"

  const speakers = [
    {
      id: "1.1",
      name: "Michael Intrator",
      company: "CoreWeave",
      position: "CEO",
      place: "Lisbon",
      url: "/pics/mm-speaker.png",
    },
    {
      id: "1.2",
      name: "Sarah Johnson",
      company: "Tech Solutions",
      position: "CTO",
      place: "New York",
      url: "/pics/sarah-johnsons.png",
    },
    {
      id: "1.3",
      name: "David Lee",
      company: "InnovateX",
      position: "Founder",
      place: "San Francisco",
      url: "/pics/david-lee.png",
    },
    {
      id: "1.4",
      name: "Ava Brown",
      company: "Green Tech",
      position: "COO",
      place: "London",
      url: "/pics/ava-brown.png",
    },
    {
      id: "1.5",
      name: "Elon Miller",
      company: "Future Vision",
      position: "Chief Scientist",
      place: "Berlin",
      url: "/pics/ellon-miller.png",
    },
    {
      id: "1.6",
      name: "Rachel Adams",
      company: "Quantum Leap",
      position: "Research Director",
      place: "Tokyo",
      url: "/pics/rachel-adams.png",
    },
    {
      id: "1.7",
      name: "Zara Singh",
      company: "CyberSecure",
      position: "Lead Security Analyst",
      place: "Delhi",
      url: "/pics/zara-patel.png",
    },
    {
      id: "1.8",
      name: "Ethan Patel",
      company: "GreenTech Innovations",
      position: "Chief Sustainability Officer",
      place: "Toronto",
      url: "/pics/ethan-patel.png",
    },
  ];

  mydb.run(
    `CREATE TABLE speakers (
      sid INTEGER PRIMARY KEY AUTOINCREMENT, 
      sname TEXT NOT NULL, 
      scompany TEXT NOT NULL, 
      sposition TEXT NOT NULL, 
      splace TEXT NOT NULL, 
      surl TEXT NOT NULL
    )`,
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("---> Table speakers created!");

        speakers.forEach((onespeaker) => {
          mydb.run(
            `INSERT INTO speakers (sname, scompany, sposition, splace, surl) VALUES (?, ?, ?, ?, ?)`,
            [
              onespeaker.name,
              onespeaker.company,
              onespeaker.position,
              onespeaker.place,
              onespeaker.url,
            ],
            (error) => {
              if (error) {
                console.log("ERROR: ", error);
              } else {
                console.log("Line added into the speakers table!");
              }
            }
          );
        });
      }
    }
  );
}

function initTablePartners(mydb) {
  const partners = [
    {
      id: "1",
      name: "Google AI",
      desc: "A leader in artificial intelligence research and applications, Google AI is at the forefront of breakthroughs in machine learning, natural language processing, and responsible AI practices.",
      website: "https://ai.google/",
    },
    {
      id: "2",
      name: "Ethereum Foundation",
      desc: "Dedicated to supporting and growing the Ethereum ecosystem, the Ethereum Foundation promotes decentralized technology through research, education, and innovation in blockchain.",
      website: "https://ethereum.org/en/foundation/",
    },
    {
      id: "3",
      name: "IBM Quantum",
      desc: "IBM Quantum is pioneering quantum computing to solve the world's most complex problems, offering quantum cloud services and collaboration for academic and commercial breakthroughs.",
      website: "https://www.ibm.com/quantum-computing/",
    },
    {
      id: "4",
      name: "Cybersecurity Ventures",
      desc: "A trusted source for global cybersecurity market research, Cybersecurity Ventures tracks the industry's latest trends, reports, and predictions.",
      website: "https://cybersecurityventures.com/",
    },
    {
      id: "5",
      name: "Tesla Energy",
      desc: "Tesla Energy is committed to advancing sustainable energy solutions, including solar power, energy storage, and grid optimization technologies to address global climate challenges.",
      website: "https://www.tesla.com/energy",
    },
    {
      id: "6",
      name: "NVIDIA",
      desc: "A leader in visual computing technology, NVIDIA is advancing the metaverse with powerful GPUs and AI capabilities that enable immersive experiences and digital realities.",
      website: "https://www.nvidia.com/en-us/",
    },
    {
      id: "7",
      name: "OpenAI",
      desc: "OpenAI aims to ensure that artificial general intelligence (AGI) benefits all of humanity, focusing on long-term AI safety and developing advanced AI tools and frameworks.",
      website: "https://openai.com/",
    },
  ];

  mydb.run(
    `CREATE TABLE partners (
      pid INTEGER PRIMARY KEY AUTOINCREMENT, 
      pname TEXT NOT NULL, 
      pdesc TEXT NOT NULL, 
     pwebsite TEXT NOT NULL
      
    )`,
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("---> Table partners created!");
        partners.forEach((partner) => {
          mydb.run(
            `INSERT INTO partners (pname, pdesc,pwebsite) VALUES (?, ?, ?)`,
            [partner.name, partner.desc, partner.website],
            (error) => {
              if (error) {
                console.log("ERROR: ", error);
              } else {
                console.log("Line added into the speakers table!");
              }
            }
          );
        });
      }
    }
  );
}

function initTableEventsAndSpeakers(mydb) {
  mydb.run(
    `CREATE TABLE eventsandspeakers (
      esid INTEGER PRIMARY KEY AUTOINCREMENT, 
      event_id INTEGER, 
      speaker_id INTEGER,
     FOREIGN KEY (event_id) REFERENCES events(eid),
  FOREIGN KEY (speaker_id) REFERENCES speakers(sid)
  
   )`,
    (error) => {
      if (error) {
        console.log("ERROR: ", error);
      } else {
        console.log("---> Table partners created!");

        mydb.run(
          `INSERT INTO eventsandspeakers (event_id,speaker_id) VALUES (1,2),(2,2),(3,5),(4,7),(5,6),(6,3),(7,1),(8,2),(9,1),(10,3),(12,5),(14,4),(13,3);`,

          (error) => {
            if (error) {
              console.log("ERROR: ", error);
            } else {
              console.log("Line added into the events_speakers table!");
            }
          }
        );
      }
    }
  );
}
