import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export interface StudentReview {
  id: string;
  studentName: string;
  studentRole?: string;
  rating: number;
  review: string;
  date?: string;
  avatar?: string;
}

interface ReviewsProps {
  clubName: string;
  reviews?: StudentReview[];
}

const defaultReviews: StudentReview[] = [
  {
    id: "1",
    studentName: "Priya Sharma",
    studentRole: "3rd Year CS",
    rating: 5,
    review:
      "This club has been instrumental in my learning journey. The workshops are well-structured and the mentors are incredibly supportive!",
    date: "2 weeks ago",
  },
  {
    id: "2",
    studentName: "Rahul Kumar",
    studentRole: "2nd Year ECE",
    rating: 5,
    review:
      "Amazing community! I've made great friends here and learned so much. Highly recommend joining!",
    date: "1 month ago",
  },
  {
    id: "3",
    studentName: "Anjali Patel",
    studentRole: "1st Year Mechanical",
    rating: 4,
    review:
      "Great place to start learning. The events are informative and the club members are very welcoming.",
    date: "3 weeks ago",
  },
  {
    id: "4",
    studentName: "Vikram Singh",
    studentRole: "4th Year CSE",
    rating: 5,
    review:
      "Being part of this club prepared me for my placements. The practical knowledge gained here is invaluable!",
    date: "1 week ago",
  },
];

export default function StudentReviews({
  clubName,
  reviews = defaultReviews,
}: ReviewsProps) {
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Overall Rating</p>
            <div className="flex items-center gap-2">
              <div className="text-4xl font-bold">{averageRating}</div>
              <div className="flex flex-col">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(Number(averageRating))
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {reviews.length} reviews
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 text-right">
            <p className="text-sm text-muted-foreground mb-2">Why students love {clubName}</p>
            <div className="space-y-2">
              <Badge>Great Community</Badge>
              <Badge variant="secondary">Hands-on Learning</Badge>
              <Badge>Industry Connections</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Student Testimonials</h3>
        {reviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src={review.avatar} />
                <AvatarFallback>{review.studentName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.studentName}</p>
                    {review.studentRole && (
                      <p className="text-sm text-muted-foreground">
                        {review.studentRole}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-foreground leading-relaxed mb-2">
                  "{review.review}"
                </p>
                {review.date && (
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
