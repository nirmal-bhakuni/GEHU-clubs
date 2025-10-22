import ClubCard from '../ClubCard'

export default function ClubCardExample() {
  return (
    <div className="p-8 max-w-sm">
      <ClubCard
        id="1"
        name="Tech Club"
        description="Building innovative solutions and learning cutting-edge technologies together. Join us for hackathons, workshops, and tech talks."
        memberCount={125}
        category="Technology"
      />
    </div>
  )
}
