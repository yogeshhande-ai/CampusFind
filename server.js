// ==========================================
// CAMPUSFIND - BACKEND SERVER
// ==========================================

const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const nodemailer = require("nodemailer");
const MongoStore = require("connect-mongo").default;
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

require("dotenv").config();


// ==========================================
// EMAIL CONFIGURATION
// ==========================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }

});


// ==========================================
// APP CONFIGURATION
// ==========================================

const app = express();

const PORT = process.env.PORT || 3000;

// ==========================================
// CLOUDINARY CONFIGURATION
// ==========================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ==========================================
// IMAGE UPLOAD CONFIGURATION
// ==========================================

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "campusfind",
        allowed_formats: ["jpg", "png", "webp"]
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(
                "Only JPG, PNG, and WEBP images are allowed."
            ));
        }
    }
});

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);

// ==========================================
// SESSION CONFIGURATION
// ==========================================

app.set("trust proxy", 1);

app.use(
    session({
        secret: process.env.SESSION_SECRET || "campusfind_secret",
        resave: false,
        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            dbName: "lost_found_portal",
            collectionName: "sessions",
            ttl: 60 * 60 * 24
        }),

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// ==========================================
// SESSION CONFIGURATION
// ==========================================

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            dbName: "lost_found_portal",
            collectionName: "sessions",
            ttl: 60 * 60 * 24
        }),

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// ==========================================
// SERVE FRONTEND
// ==========================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// ==========================================
// SERVE UPLOADED IMAGES
// ==========================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// ==========================================
// MONGODB CONNECTION
// ==========================================

const client =
    new MongoClient(
        process.env.MONGO_URI
    );

let db;


async function connectDatabase() {

    try {

        await client.connect();

        db =
            client.db(
                "lost_found_portal"
            );

        console.log(
            "MongoDB connected successfully!"
        );

    } catch (error) {

        console.error(
            "MongoDB connection failed:",
            error
        );

        throw error;

    }

}


// ==========================================
// AUTHENTICATION HELPER
// ==========================================

function requireLogin(
    req,
    res,
    next
) {

    if (
        !req.session.userId
    ) {

        return res
            .status(401)
            .json({

                message:
                    "Please login first."

            });

    }

    next();

}


// ==========================================
// HEALTH CHECK
// ==========================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            status:
                "ok",

            message:
                "CampusFind server is running."

        });

    }
);


// ==========================================
// TEST API
// ==========================================

app.get(
    "/api/test",
    (req, res) => {

        res.json({

            message:
                "Backend is working!"

        });

    }
);


// ==========================================
// USER REGISTRATION
// ==========================================

app.post(
    "/api/register",
    async (req, res) => {

        try {

            const {
                name,
                email,
                password
            } = req.body;


            // CHECK REQUIRED FIELDS

            if (
                !name ||
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please fill all fields."

                    });

            }


            // CHECK PASSWORD LENGTH

            if (
                password.length < 6
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Password must be at least 6 characters."

                    });

            }


            // CLEAN EMAIL

            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();


            // CHECK EMAIL FORMAT

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailPattern.test(
                    cleanEmail
                )
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please enter a valid email address."

                    });

            }


            // CHECK IF USER ALREADY EXISTS

            const existingUser =
                await db
                    .collection("users")
                    .findOne({

                        email:
                            cleanEmail

                    });


            if (
                existingUser
            ) {

                return res
                    .status(409)
                    .json({

                        message:
                            "Email is already registered."

                    });

            }


            // HASH PASSWORD

            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            // CREATE USER

            const user = {

                name:
                    name.trim(),

                email:
                    cleanEmail,

                password:
                    hashedPassword,

                createdAt:
                    new Date()

            };


            // SAVE USER

            const result =
                await db
                    .collection("users")
                    .insertOne(
                        user
                    );


            // SEND SUCCESS RESPONSE

            res
                .status(201)
                .json({

                    message:
                        "Account created successfully!",

                    userId:
                        result.insertedId

                });


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to create account."

                });

        }

    }
);


// ==========================================
// USER LOGIN
// ==========================================

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            // CHECK REQUIRED FIELDS

            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Email and password are required."

                    });

            }


            // CLEAN EMAIL

            const cleanEmail =
                email
                    .trim()
                    .toLowerCase();


            // FIND USER

            const user =
                await db
                    .collection("users")
                    .findOne({

                        email:
                            cleanEmail

                    });


            if (
                !user
            ) {

                return res
                    .status(401)
                    .json({

                        message:
                            "Invalid email or password."

                    });

            }


            // CHECK PASSWORD

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (
                !passwordMatch
            ) {

                return res
                    .status(401)
                    .json({

                        message:
                            "Invalid email or password."

                    });

            }


 // CREATE LOGIN SESSION

req.session.userId = user._id.toString();
req.session.userName = user.name;
req.session.userEmail = user.email;

// SAVE SESSION BEFORE SENDING RESPONSE
req.session.save((err) => {
    if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({
            message: "Could not save login session."
        });
    }

    return res.json({
        message: "Login successful!",
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    });
});




            // SEND RESPONSE

            res.json({

                message:
                    "Login successful!",

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email

                }

            });


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Server error during login."

                });

        }

    }
);


// ==========================================
// CHECK CURRENT LOGGED-IN USER
// ==========================================

app.get(
    "/api/me",
    (req, res) => {

        if (
            !req.session.userId
        ) {

            return res
                .status(401)
                .json({

                    message:
                        "Not logged in."

                });

        }


        res.json({

            loggedIn:
                true,

            user: {

                id:
                    req.session.userId,

                name:
                    req.session.userName,

                email:
                    req.session.userEmail

            }

        });

    }
);


// ==========================================
// UPDATE USER PROFILE
// ==========================================

app.put(
    "/api/profile",
    requireLogin,
    async (req, res) => {

        try {

            // GET UPDATED DATA

            const name =
                req.body.name?.trim();

            const email =
                req.body.email
                    ?.trim()
                    .toLowerCase();


            // CHECK REQUIRED FIELDS

            if (
                !name ||
                !email
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Name and email are required."

                    });

            }


            // CHECK EMAIL FORMAT

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (
                !emailPattern.test(
                    email
                )
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please enter a valid email address."

                    });

            }


            // CHECK IF EMAIL IS ALREADY USED

            const existingUser =
                await db
                    .collection("users")
                    .findOne({

                        email:
                            email,

                        _id: {

                            $ne:
                                new ObjectId(
                                    req.session.userId
                                )

                        }

                    });


            if (
                existingUser
            ) {

                return res
                    .status(409)
                    .json({

                        message:
                            "This email is already registered."

                    });

            }


            // UPDATE USER

            const result =
                await db
                    .collection("users")
                    .updateOne(

                        {

                            _id:
                                new ObjectId(
                                    req.session.userId
                                )

                        },

                        {

                            $set: {

                                name:
                                    name,

                                email:
                                    email

                            }

                        }

                    );


            if (
                result.matchedCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        message:
                            "User not found."

                    });

            }


            // UPDATE SESSION

            req.session.userName =
                name;

            req.session.userEmail =
                email;


            // SUCCESS RESPONSE

            res.json({

                message:
                    "Profile updated successfully!",

                user: {

                    name:
                        name,

                    email:
                        email

                }

            });


        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to update profile."

                });

        }

    }
);


// ==========================================
// CHANGE USER PASSWORD
// ==========================================

app.put(
    "/api/change-password",
    requireLogin,
    async (req, res) => {

        try {

            const currentPassword =
                req.body.currentPassword;

            const newPassword =
                req.body.newPassword;


            // CHECK REQUIRED FIELDS

            if (
                !currentPassword ||
                !newPassword
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please fill all password fields."

                    });

            }


            // CHECK NEW PASSWORD LENGTH

            if (
                newPassword.length < 6
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "New password must be at least 6 characters."

                    });

            }


            // FIND CURRENT USER

            const user =
                await db
                    .collection("users")
                    .findOne({

                        _id:
                            new ObjectId(
                                req.session.userId
                            )

                    });


            if (
                !user
            ) {

                return res
                    .status(404)
                    .json({

                        message:
                            "User not found."

                    });

            }


            // CHECK CURRENT PASSWORD

            const passwordMatch =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );


            if (
                !passwordMatch
            ) {

                return res
                    .status(401)
                    .json({

                        message:
                            "Current password is incorrect."

                    });

            }


            // HASH NEW PASSWORD

            const hashedPassword =
                await bcrypt.hash(
                    newPassword,
                    10
                );


            // UPDATE PASSWORD

            await db
                .collection("users")
                .updateOne(

                    {

                        _id:
                            new ObjectId(
                                req.session.userId
                            )

                    },

                    {

                        $set: {

                            password:
                                hashedPassword

                        }

                    }

                );


            res.json({

                message:
                    "Password changed successfully!"

            });


        } catch (error) {

            console.error(
                "Change password error:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to change password."

                });

        }

    }
);


// ==========================================
// USER LOGOUT
// ==========================================

app.post(
    "/api/logout",
    (req, res) => {

        req.session.destroy(
            (error) => {

                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    return res
                        .status(500)
                        .json({

                            message:
                                "Logout failed."

                        });

                }


                res.clearCookie(
                    "connect.sid"
                );


                res.json({

                    message:
                        "Logout successful!"

                });

            }
        );

    }
);


// ==========================================
// GET ALL ITEMS
// ==========================================

app.get(
    "/api/items",
    async (req, res) => {

        try {

            const items =
                await db
                    .collection("items")
                    .find()
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            // OLD ITEMS WITHOUT STATUS
            // WILL BE TREATED AS ACTIVE

            const itemsWithStatus =
                items.map(
                    item => ({

                        ...item,

                        status:
                            item.status ||
                            "active"

                    })
                );


            res.json(
                itemsWithStatus
            );


        } catch (error) {

            console.error(
                "Error getting items:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to get items"

                });

        }

    }
);

// ==========================================
// DASHBOARD API
// ==========================================

app.get("/api/dashboard", async (req, res) => {

    try {

        // User must be logged in
        if (!req.session.userId) {

            return res.status(401).json({
                message: "Please login first."
            });

        }


        // ==========================================
        // TOTAL REPORTS
        // ==========================================

        const totalReports =
            await db.collection("items").countDocuments();


        // ==========================================
        // ACTIVE REPORTS
        // ==========================================

        const activeReports =
            await db.collection("items").countDocuments({
                status: {
                    $ne: "resolved"
                }
            });


        // ==========================================
        // RESOLVED REPORTS
        // ==========================================

        const resolvedReports =
            await db.collection("items").countDocuments({
                status: "resolved"
            });


        // ==========================================
        // MY REPORTS
        // ==========================================

        const myReports =
            await db.collection("items").countDocuments({
                userId: req.session.userId
            });


        // ==========================================
        // MY LOST REPORTS
        // ==========================================

        const myLostReports =
            await db.collection("items").countDocuments({
                userId: req.session.userId,
                type: "Lost"
            });


        // ==========================================
        // MY FOUND REPORTS
        // ==========================================

        const myFoundReports =
            await db.collection("items").countDocuments({
                userId: req.session.userId,
                type: "Found"
            });


        // ==========================================
        // SEND DASHBOARD DATA
        // ==========================================

        res.json({

            totalReports,

            activeReports,

            resolvedReports,

            myReports,

            myLostReports,

            myFoundReports

        });


    } catch (error) {

        console.error(
            "Dashboard API error:",
            error
        );


        res.status(500).json({

            message:
                "Failed to load dashboard data."

        });

    }

});

// ==========================================
// GET MY REPORTS
// ==========================================

app.get(
    "/api/my-reports",
    requireLogin,
    async (req, res) => {

        try {

            // GET ONLY CURRENT USER'S REPORTS

            const items =
                await db
                    .collection("items")
                    .find({

                        userId:
                            req.session.userId

                    })
                    .sort({

                        createdAt:
                            -1

                    })
                    .toArray();


            // ADD DEFAULT STATUS FOR OLD REPORTS

            const itemsWithStatus =
                items.map(
                    item => ({

                        ...item,

                        status:
                            item.status ||
                            "active"

                    })
                );


            res.json(
                itemsWithStatus
            );


        } catch (error) {

            console.error(
                "Error getting my reports:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to get your reports."

                });

        }

    }
);


// ==========================================
// ADD NEW ITEM
// ==========================================

app.post(
    "/api/items",
    upload.single("image"),
    async (req, res) => {

        try {

            // CHECK LOGIN

            if (
                !req.session.userId
            ) {

                return res
                    .status(401)
                    .json({

                        message:
                            "Please login before reporting an item."

                    });

            }


            // GET FORM DATA

            const {
                type,
                itemName,
                category,
                location,
                date,
                description,
                contact
            } = req.body;


            // CHECK REQUIRED FIELDS

            if (
                !type ||
                !itemName ||
                !category ||
                !location ||
                !date ||
                !description ||
                !contact
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please fill all required fields."

                    });

            }


            // CLEAN INPUT DATA

            const cleanType =
                type.trim();

            const cleanItemName =
                itemName.trim();

            const cleanCategory =
                category.trim();

            const cleanLocation =
                location.trim();

            const cleanDescription =
                description.trim();

            const cleanContact =
                contact.trim();


            // CHECK EMPTY VALUES

            if (
                !cleanType ||
                !cleanItemName ||
                !cleanCategory ||
                !cleanLocation ||
                !cleanDescription ||
                !cleanContact
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please enter valid information in all required fields."

                    });

            }


            // VALIDATE ITEM TYPE

            if (
                cleanType !== "Lost" &&
                cleanType !== "Found"
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Item type must be Lost or Found."

                    });

            }


            // VALIDATE DATE

            if (
                !date ||
                isNaN(
                    Date.parse(date)
                )
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please enter a valid date."

                    });

            }


            // VALIDATE CONTACT

            const contactPattern =
                /^[0-9+\-\s()]{7,20}$/;


            if (
                !contactPattern.test(
                    cleanContact
                )
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please enter a valid contact number."

                    });

            }


            // CREATE ITEM

            const item = {

                type:
                    cleanType,

                itemName:
                    cleanItemName,

                category:
                    cleanCategory,

                location:
                    cleanLocation,

                date:
                    date,

                description:
                    cleanDescription,

                contact:
                    cleanContact,


                // IMAGE

                image:
                    req.file
                        ? req.file.path
                        : null,


                // USER INFORMATION

                userId:
                    req.session.userId,

                userName:
                    req.session.userName,

                userEmail:
                    req.session.userEmail,


                // ITEM STATUS

                status:
                    "active",


                // CREATED DATE

                createdAt:
                    new Date()

            };


            // SAVE ITEM

            const result =
                await db
                    .collection("items")
                    .insertOne(
                        item
                    );


            // SUCCESS RESPONSE

            res.json({

                message:
                    "Item reported successfully!",

                id:
                    result.insertedId

            });


        } catch (error) {

            console.error(
                "Error adding item:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to report item"

                });

        }

    }
);


// ==========================================
// UPDATE ITEM
// ==========================================

app.put(
    "/api/items/:id",
    requireLogin,
    async (req, res) => {

        try {

            const id =
                req.params.id;


            // CHECK VALID MONGODB ID

            if (
                !ObjectId.isValid(id)
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Invalid item ID"

                    });

            }


            // FIND ITEM

            const existingItem =
                await db
                    .collection("items")
                    .findOne({

                        _id:
                            new ObjectId(id)

                    });


            if (
                !existingItem
            ) {

                return res
                    .status(404)
                    .json({

                        message:
                            "Item not found"

                    });

            }


            // CHECK OWNERSHIP

            if (
                !existingItem.userId ||
                existingItem.userId !==
                    req.session.userId
            ) {

                return res
                    .status(403)
                    .json({

                        message:
                            "You can only edit your own reports."

                    });

            }


            // CLEAN UPDATED DATA

            const cleanType =
                String(
                    req.body.type || ""
                ).trim();

            const cleanItemName =
                String(
                    req.body.itemName || ""
                ).trim();

            const cleanCategory =
                String(
                    req.body.category || ""
                ).trim();

            const cleanLocation =
                String(
                    req.body.location || ""
                ).trim();

            const cleanDate =
                String(
                    req.body.date || ""
                ).trim();

            const cleanDescription =
                String(
                    req.body.description || ""
                ).trim();

            const cleanContact =
                String(
                    req.body.contact || ""
                ).trim();


            // VALIDATE REQUIRED VALUES

            if (
                !cleanType ||
                !cleanItemName ||
                !cleanCategory ||
                !cleanLocation ||
                !cleanDate ||
                !cleanDescription ||
                !cleanContact
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please fill all required fields."

                    });

            }


            // VALIDATE ITEM TYPE

            if (
                cleanType !== "Lost" &&
                cleanType !== "Found"
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Item type must be Lost or Found."

                    });

            }


            // VALIDATE DATE

            if (
                isNaN(
                    Date.parse(
                        cleanDate
                    )
                )
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please enter a valid date."

                    });

            }


            // VALIDATE CONTACT

            const contactPattern =
                /^[0-9+\-\s()]{7,20}$/;


            if (
                !contactPattern.test(
                    cleanContact
                )
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Please enter a valid contact number."

                    });

            }


            // UPDATED DATA

            const updatedItem = {

                type:
                    cleanType,

                itemName:
                    cleanItemName,

                category:
                    cleanCategory,

                location:
                    cleanLocation,

                date:
                    cleanDate,

                description:
                    cleanDescription,

                contact:
                    cleanContact

            };


            // UPDATE DATABASE

            const result =
                await db
                    .collection("items")
                    .updateOne(

                        {

                            _id:
                                new ObjectId(id),

                            userId:
                                req.session.userId

                        },

                        {

                            $set:
                                updatedItem

                        }

                    );


            if (
                result.matchedCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        message:
                            "Item not found or you do not have permission."

                    });

            }


            res.json({

                message:
                    "Item updated successfully!"

            });


        } catch (error) {

            console.error(
                "Error updating item:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to update item"

                });

        }

    }
);


// ==========================================
// MARK ITEM AS RESOLVED
// ==========================================

app.put(
    "/api/items/:id/resolve",
    requireLogin,
    async (req, res) => {

        try {

            const id =
                req.params.id;


            // CHECK VALID MONGODB ID

            if (
                !ObjectId.isValid(id)
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Invalid item ID."

                    });

            }


            // FIND ITEM

            const existingItem =
                await db
                    .collection("items")
                    .findOne({

                        _id:
                            new ObjectId(id)

                    });


            if (
                !existingItem
            ) {

                return res
                    .status(404)
                    .json({

                        message:
                            "Item not found."

                    });

            }


            // ONLY OWNER CAN RESOLVE

            if (
                !existingItem.userId ||
                existingItem.userId !==
                    req.session.userId
            ) {

                return res
                    .status(403)
                    .json({

                        message:
                            "You can only update the status of your own reports."

                    });

            }


            // CHECK IF ALREADY RESOLVED

            if (
                existingItem.status ===
                "resolved"
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "This item is already resolved."

                    });

            }


            // UPDATE STATUS

            const result =
                await db
                    .collection("items")
                    .updateOne(

                        {

                            _id:
                                new ObjectId(id),

                            userId:
                                req.session.userId

                        },

                        {

                            $set: {

                                status:
                                    "resolved",

                                resolvedAt:
                                    new Date()

                            }

                        }

                    );


            if (
                result.matchedCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        message:
                            "Item not found or you do not have permission."

                    });

            }


            res.json({

                message:
                    "Item marked as resolved successfully!"

            });


        } catch (error) {

            console.error(
                "Error marking item as resolved:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to mark item as resolved."

                });

        }

    }
);

// ==========================================
// MARK ITEM AS RESOLVED
// ==========================================

app.put("/api/items/:id/resolve", async (req, res) => {

    try {

        if (!req.session.userId) {
            return res.status(401).json({
                message: "Please login first."
            });
        }

        const itemId = req.params.id;

        if (!ObjectId.isValid(itemId)) {
            return res.status(400).json({
                message: "Invalid item ID."
            });
        }

        const item = await db.collection("items").findOne({
            _id: new ObjectId(itemId)
        });

        if (!item) {
            return res.status(404).json({
                message: "Item not found."
            });
        }

        // Only the owner can mark the item as resolved
        if (
            String(item.userId) !==
            String(req.session.userId)
        ) {
            return res.status(403).json({
                message: "You can only resolve your own reports."
            });
        }

        // Prevent resolving an already resolved item
        if (item.status === "resolved") {
            return res.status(400).json({
                message: "Item is already resolved."
            });
        }

        await db.collection("items").updateOne(
            {
                _id: new ObjectId(itemId)
            },
            {
                $set: {
                    status: "resolved",
                    resolvedAt: new Date()
                }
            }
        );

        res.json({
            message: "Item marked as resolved successfully!"
        });

    } catch (error) {

        console.error(
            "Resolve item error:",
            error
        );

        res.status(500).json({
            message: "Failed to resolve item."
        });

    }

});

// ==========================================
// DELETE ITEM
// ==========================================

app.delete(
    "/api/items/:id",
    requireLogin,
    async (req, res) => {

        try {

            const id =
                req.params.id;


            // CHECK VALID MONGODB ID

            if (
                !ObjectId.isValid(id)
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Invalid item ID"

                    });

            }


            // DELETE ONLY IF USER OWNS ITEM

            const result =
                await db
                    .collection("items")
                    .deleteOne({

                        _id:
                            new ObjectId(id),

                        userId:
                            req.session.userId

                    });


            if (
                result.deletedCount === 0
            ) {

                return res
                    .status(403)
                    .json({

                        message:
                            "Item not found or you do not have permission to delete it."

                    });

            }


            res.json({

                message:
                    "Item deleted successfully!"

            });


        } catch (error) {

            console.error(
                "Error deleting item:",
                error
            );

            res
                .status(500)
                .json({

                    message:
                        "Failed to delete item"

                });

        }

    }
);


// ==========================================
// IMAGE UPLOAD ERROR HANDLER
// ==========================================

app.use(
    (error, req, res, next) => {

        if (
            error instanceof
            multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res
                    .status(400)
                    .json({

                        message:
                            "Image size must be 5 MB or less."

                    });

            }


            return res
                .status(400)
                .json({

                    message:
                        "Image upload failed."

                });

        }


        if (
            error &&
            error.message ===
                "Only JPG, PNG, and WEBP images are allowed."
        ) {

            return res
                .status(400)
                .json({

                    message:
                        error.message

                });

        }


        next(error);

    }
);


// ==========================================
// START SERVER LOCALLY
// ==========================================

if (require.main === module) {
    async function startServer() {
        try {
            await connectDatabase();

            app.listen(PORT, () => {
                console.log(
                    `Server running at http://localhost:${PORT}`
                );
            });
        } catch (error) {
            console.error(
                "Failed to start server:",
                error
            );
        }
    }

    startServer();
}

// ==========================================
// EXPORT FOR VERCEL
// ==========================================

module.exports = {
    app,
    connectDatabase
};

