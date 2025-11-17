import { useState } from "react";
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
import { Upload, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Club } from "@shared/schema";

export default function UploadForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    clubId: "",
    clubName: "",
  });

  const { toast } = useToast();
  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const formDataToSend = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formDataToSend.append(key, value as string);
      });
      if (selectedFiles.length > 0) {
        formDataToSend.append("image", selectedFiles[0]);
      }

      const response = await fetch("/api/events", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created",
        description: "Your event has been successfully created.",
      });
      // Reset form
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        category: "",
        clubId: "",
        clubName: "",
      });
      setSelectedFiles([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clubId) {
      toast({
        title: "Error",
        description: "Please select a club",
        variant: "destructive",
      });
      return;
    }

    const selectedClub = clubs.find(c => c.id === formData.clubId);
    const dataToSubmit = {
      ...formData,
      clubName: selectedClub?.name || "",
    };

    createEventMutation.mutate(dataToSubmit);
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Create New Event</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="event-title">Event Title</Label>
          <Input
            id="event-title"
            placeholder="Enter event title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            data-testid="input-event-title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-description">Description</Label>
          <Textarea
            id="event-description"
            placeholder="Describe your event..."
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            data-testid="input-event-description"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event-date">Date</Label>
            <Input
              id="event-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              data-testid="input-event-date"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-time">Time</Label>
            <Input
              id="event-time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
              data-testid="input-event-time"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-location">Location</Label>
          <Input
            id="event-location"
            placeholder="Event location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
            data-testid="input-event-location"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-club">Club</Label>
          <Select 
            value={formData.clubId} 
            onValueChange={(value) => setFormData({ ...formData, clubId: value })}
          >
            <SelectTrigger id="event-club" data-testid="select-event-club">
              <SelectValue placeholder="Select club" />
            </SelectTrigger>
            <SelectContent>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-category">Category</Label>
          <Select 
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger id="event-category" data-testid="select-event-category">
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
          <Label>Event Poster / Photos</Label>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover-elevate"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            data-testid="dropzone-files"
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2 font-body">
              Drag and drop files here, or click to browse
            </p>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
              data-testid="button-browse-files"
            >
              Browse Files
            </Button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                  data-testid={`file-item-${index}`}
                >
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8"
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            type="submit" 
            className="flex-1" 
            disabled={createEventMutation.isPending}
            data-testid="button-submit-event"
          >
            {createEventMutation.isPending ? "Creating..." : "Create Event"}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => {
              setFormData({
                title: "",
                description: "",
                date: "",
                time: "",
                location: "",
                category: "",
                clubId: "",
                clubName: "",
              });
              setSelectedFiles([]);
            }}
            data-testid="button-cancel-event"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
