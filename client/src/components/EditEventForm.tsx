import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";

interface EditEventFormProps {
  event?: Event;
  clubId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditEventForm({ event, clubId, onClose, onSuccess }: EditEventFormProps) {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date || "",
    time: event?.time || "",
    location: event?.location || "",
    category: event?.category || "",
    clubId: event?.clubId || clubId || "",
  });
  const [newImage, setNewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(event?.imageUrl || null);

  const { toast } = useToast();
  
  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const formDataToSend = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formDataToSend.append(key, value as string);
      });
      if (newImage) {
        formDataToSend.append("image", newImage);
      }

      const url = event ? `/api/events/${event.id}` : "/api/events";
      const method = event ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to ${event ? "update" : "create"} event`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: `Event ${event ? "updated" : "created"}`,
        description: `Your event has been successfully ${event ? "updated" : "created"}.`,
      });
      onSuccess?.();
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: `Failed to ${event ? "update" : "create"} event. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setNewImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEventMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-border bg-card">
          <h2 className="text-2xl font-semibold">Edit Event</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close-edit"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-event-title">Event Title</Label>
            <Input
              id="edit-event-title"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              data-testid="input-edit-event-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-event-description">Description</Label>
            <Textarea
              id="edit-event-description"
              placeholder="Describe your event..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              data-testid="input-edit-event-description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-event-date">Date</Label>
              <Input
                id="edit-event-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                data-testid="input-edit-event-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-event-time">Time</Label>
              <Input
                id="edit-event-time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                data-testid="input-edit-event-time"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-event-location">Location</Label>
            <Input
              id="edit-event-location"
              placeholder="Event location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
              data-testid="input-edit-event-location"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-event-category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="edit-event-category" data-testid="select-edit-event-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="bootcamp">Bootcamp</SelectItem>
                <SelectItem value="seminar">Seminar</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="competition">Competition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Event Image</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              {previewUrl && (
                <div className="mb-4">
                  <img
                    src={previewUrl}
                    alt="Event preview"
                    className="max-h-48 mx-auto rounded-md object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="edit-file-upload"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById("edit-file-upload")?.click()}
                data-testid="button-browse-edit-files"
              >
                Choose Image
              </Button>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={updateEventMutation.isPending}
              data-testid="button-submit-edit-event"
            >
              {updateEventMutation.isPending ? (event ? "Updating..." : "Creating...") : (event ? "Update Event" : "Create Event")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              data-testid="button-cancel-edit-event"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
