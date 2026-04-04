import EventCard from '../EventCard'

import eventImage from '@assets/stock_images/tech_bootcamp_coding_5dbe6dd9.jpg'

export default function EventCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <EventCard
        id="1"
        title="Web Development Bootcamp"
        description="Learn modern web development with React, Node.js, and more in this intensive 3-day bootcamp."
        date="March 15, 2024"
        time="9:00 AM - 5:00 PM"
        location="Engineering Building, Room 301"
        clubName="Tech Club"
        category="Bootcamp"
        imageUrl={eventImage}
      />
    </div>
  )
}
