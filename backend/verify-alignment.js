const mongoose = require('mongoose');
require('dotenv').config();

const verifyAlignment = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Assignment = mongoose.model('Assignment', new mongoose.Schema({ title: String, course: mongoose.Schema.Types.ObjectId }));
        const Course = mongoose.model('Course', new mongoose.Schema({ title: String }));

        const assignments = await Assignment.find({}).limit(10);
        console.log(`Found ${assignments.length} assignments. Verifying links...`);

        for (const ass of assignments) {
            const course = await Course.findById(ass.course);
            console.log(`- "${ass.title}" -> "${course ? course.title : 'NOT FOUND'}"`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyAlignment();
