import mongoose from "mongoose";

const uri =
"mongodb+srv://sreejapuram_db_user:IJvnioBawXDounkpnod@cluster0.owcpxix.mongodb.net/feedback_db?retryWrites=true&w=majority&appName=Cluster0";

try {
    await mongoose.connect(uri);
    console.log("✅ Connected");
} catch (err) {
    console.error(err);
}

process.exit();