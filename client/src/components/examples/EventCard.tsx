import EventCard from '../EventCard'

const eventImage = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80'

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
