import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const eventSchema = new mongoose.Schema({
  id: String,
  title: String,
  clubId: String,
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

async function testEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const events = await Event.find({});
    console.log(`📊 Total events in DB: ${events.length}\n`);
    
    if (events.length > 0) {
      console.log('Events:');
      events.forEach(e => {
        console.log(`  - ID: ${e.id} (${e._id})`);
        console.log(`    Title: ${e.title}`);
        console.log(`    ClubID: ${e.clubId}\n`);
      });
    } else {
      console.log('⚠️ No events found!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testEvents();
