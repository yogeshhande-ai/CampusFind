
const { app, connectDatabase } = require("../server");

let databaseReady = false;

module.exports = async (req, res) => {
    try {
        if (!databaseReady) {
            await connectDatabase();
            databaseReady = true;
        }

        return app(req, res);
    } catch (error) {
        console.error("Vercel API error:", error);

        return res.status(500).json({
            message: "Server error. Please try again."
        });
    }
};