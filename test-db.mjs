import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Define schemas inline
const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  enrollment: String,
  branch: String,
  lastLogin: Date,
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  username: String,
  clubId: String,
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
const Admin = mongoose.model('Admin', adminSchema);

dotenv.config();

async function testDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const students = await Student.find({});
    console.log(`📊 Total students in DB: ${students.length}\n`);
    
    if (students.length > 0) {
      console.log('Students:');
      students.forEach(s => {
        console.log(`  - ${s.name} (${s.email}) - Enrollment: ${s.enrollment}`);
      });
    } else {
      console.log('⚠️ No students found in database!');
    }
    
    console.log('\n---\n');
    
    const admins = await Admin.find({});
    console.log(`👤 Total admins: ${admins.length}\n`);
    admins.forEach(a => {
      console.log(`  - ${a.username} (clubId: ${a.clubId || 'null - university admin'})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testDB();
