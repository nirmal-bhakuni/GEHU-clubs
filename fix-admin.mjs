import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

const adminSchema = new mongoose.Schema({ username: String, clubId: String });
const Admin = mongoose.model('Admin', adminSchema);

async function fixAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Update the "admin" user to have clubId = null (university admin)
    const result = await Admin.updateOne(
      { username: 'admin' },
      { $set: { clubId: null } }
    );
    
    console.log('Updated admin user:', result);
    
    // Show all admins
    const admins = await Admin.find({});
    console.log('\nAll admins:');
    admins.forEach(a => {
      console.log(`  - ${a.username} (clubId: ${a.clubId || 'null'})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixAdmin();
