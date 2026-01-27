
import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://mehedihasancou2_db_user:CArmc1XLvOi6w8Tl@cluster0.heg1nnl.mongodb.net/LearNESTDB-01?appName=Cluster0";

const batchSchema = new mongoose.Schema({
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    name: String,
    isActive: Boolean,
});

const courseSchema = new mongoose.Schema({
    title: String,
    slug: String,
    status: String,
    isPublished: Boolean
});

const Batch = mongoose.model("Batch", batchSchema);
const Course = mongoose.model("Course", courseSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses:`);

        for (const c of courses) {
            const batches = await Batch.find({ course: c._id });
            console.log(`Course: "${c.title}" (Status: ${c.status}, Published: ${c.isPublished})`);
            console.log(`   -> Batches: ${batches.length}`);
            batches.forEach(b => console.log(`      - ${b.name} (Active: ${b.isActive})`));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
