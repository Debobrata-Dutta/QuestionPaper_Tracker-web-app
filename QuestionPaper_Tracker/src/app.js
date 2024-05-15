const express = require("express");
const app = express();
const port = 5000;
const path = require("path");
const hbs = require("hbs");
const bodyParser = require("body-parser");
const multer = require('multer');
require("./db/conn");
const teacher = require("./models/add_teacher");
const question = require("./models/question_info");

const view_path = path.join(__dirname, "../template/views");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/images", express.static(path.join(__dirname, "../template/public/assets/images")));
app.use("/css", express.static(path.join(__dirname, "../template/public/assets/css")));
app.use("/js", express.static(path.join(__dirname, "../template/public/assets/js")));

app.set("view engine", "hbs");
app.set("views", view_path);

// Multer setup for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

app.get("/login", (req, res) => {
    res.render("login");
});

app.listen(port, () => {
    console.log(`Running on port: ${port}`);
    console.log(`View path: ${view_path}`);
});

app.post('/navigate', async (req, res) => {
    const qus = await question.find();
    const destination = req.body.destination;
    res.render(destination, { qus }); // Render the destination HBS file
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if email and password exist and type is "HOD"
        const hodUser = await teacher.findOne({ email, password, type: "HOD" });
        if (hodUser) {
            res.render('route_shift.hbs');
            return;
        }

        // Check if type is "subject-faculty"
        const subjectFaculty = await teacher.findOne({ email, password, type: "sub_faculty" });

        if (subjectFaculty) {
            const qus2 = await question.findOne({ facultyMail: email });
            res.render('upload_file.hbs', { qus2 }); // Pass the email to the view
            return;
        }

        // Check if type is "exam coordinator"
        const examCoordinator = await teacher.findOne({ email, password, type: "exam coordinator" });
        if (examCoordinator) {
            const qus = await question.find();
            res.render('admin.hbs',{ qus });
            return;
        }

        // If email and password not found or type is unknown
        res.send('Invalid email/password or user type.');
    } catch (error) {
        console.error('Error:', error);
        res.send('Internal Server Error');
    }
});

app.post("/save", async (req, res) => {
    const email = req.body.email;
    const adamasDomain = /^[a-zA-Z0-9._%+-]+@adamasuniversity\.ac\.in$/;

    if (adamasDomain.test(email)) {
        try {
            const add_teacher = new teacher({
                email: req.body.email,
                password: req.body.password,
            });
            await add_teacher.save();
            res.render("set_teacher.hbs");
        } catch (err) {
            console.log(err);
        }
    } else {
        res.send(`
            <script>
                alert("Please enter a valid Adamas University Student's email address ");
                window.history.back();
            </script>
        `);
    }
});

app.post("/assign", async (req, res) => {
    const email = req.body.facultyMail;
    const adamasDomain = /^[a-zA-Z0-9._%+-]+@adamasuniversity\.ac\.in$/;

    if (adamasDomain.test(email)) {
        try {
            const assign_teacher = new question({
                assignedFaculty: req.body.assignedFaculty,
                facultyMail: req.body.facultyMail,
                courseName: req.body.courseName,
                courseCode: req.body.courseCode
            });
            await assign_teacher.save();
            res.send(`
                <script>
                    alert("Your response is successfully submitted");
                    window.history.back();
                </script>
            `);
        } catch (err) {
            console.log(err);
        }
    } else {
        res.send(`
            <script>
                alert("Please enter a valid Adamas University email address ");
                window.history.back();
            </script>
        `);
    }
});
app.post("/update", async (req, res) => {
    const email = req.body.facultyMail;
    const adamasDomain = /^[a-zA-Z0-9._%+-]+@adamasuniversity\.ac\.in$/;

    if (adamasDomain.test(email)) {
        try {
            const id = req.body.id;
            const updatedData = {
                assignedFaculty: req.body.assignedFaculty,
                facultyMail: req.body.facultyMail,
                courseName: req.body.courseName,
                courseCode: req.body.courseCode
            };

            const result = await question.updateOne({_id: id}, {$set: updatedData});
            console.log(updatedData)

            if (result) {
                res.send(`
                    <script>
                        alert("Record updated successfully");
                        window.history.back();
                    </script>
                `);
            } else {
                res.send(`
                    <script>
                        alert("Record not found");
                        window.history.back();
                    </script>
                `);
            }
        } catch (err) {
            console.log(err);
            res.status(500).send(`
                <script>
                    alert("An error occurred while updating the record");
                    window.history.back();
                </script>
            `);
        }
    } else {
        res.send(`
            <script>
                alert("Please enter a valid Adamas University email address");
                window.history.back();
            </script>
        `);
    }
});


app.post('/upload', upload.single('file'), async (req, res) => {
    const { email } = req.body;

    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded');
        }

        const docPath = req.file.path;
        const questionDoc = await question.findOne({ facultyMail: email });

        if (!questionDoc) {
            return res.status(404).send('User details not found');
        }

        questionDoc.file = req.file.filename;// Set the doc field with the filename
        questionDoc.Status=req.body.status;
        await questionDoc.save();

        res.json({
            message: 'File uploaded successfully',
            // file: req.file.filename
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.post("/delete", async (req, res) => {
    const id = req.body.id;

    try {
        const result = await question.deleteOne({ _id: id });

        console.log('Delete Result:', result); // Log the result

        if (result.deletedCount > 0) {
            res.send(`
                <script>
                    alert("Record deleted successfully");
                    window.history.back();
                </script>
            `);
        } else {
            res.send(`
                <script>
                    alert("Record not found");
                    window.history.back();
                </script>
            `);
        }
    } catch (err) {
        console.error('Error during delete:', err);
        res.status(500).send(`
            <script>
                alert("An error occurred while deleting the record");
                window.history.back();
            </script>
        `);
    }
});
