import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import {
  MessageCircle,
  Send,
  Paperclip,
  Users,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Hash,
  ShieldCheck,
  CalendarDays,
  Search,
  Sparkles,
  Pin,
  Bell,
  BellOff,
  UserCog,
  UserX,
  Ban,
  Shield,
  Reply,
  PinOff,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatGroup, ChatMessage, Club, Event, ClubMembership, EventRegistration } from "@shared/schema";

type ChatIdentity = {
  loggedIn: boolean;
  role: "guest" | "student" | "club_admin" | "university_admin";
  userType?: "student" | "admin";
  userId?: string;
  displayName?: string;
  canCreateGroup?: boolean;
  clubId?: string;
  enrollmentNumber?: string;
};

type GroupResponse = {
  role: "student" | "club_admin" | "university_admin";
  canCreateGroup: boolean;
  totalUnread: number;
  sections: {
    clubs: ChatGroup[];
    events: ChatGroup[];
  };
};

type ChatOpenPayload = {
  tab?: "chats" | "events" | "verified";
  clubId?: string;
  eventId?: string;
};

type ChatMember = {
  enrollmentNumber: string;
  name: string;
  email: string;
  userKey: string;
  blocked: boolean;
};

type ChatMembersResponse = {
  groupId: string;
  groupType: "club" | "event";
  adminOnlyMessaging: boolean;
  canModerate: boolean;
  members: ChatMember[];
};

type ChatMessagesResponse = {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
};

type OutgoingMessage = {
  tempId: string;
  status: "sending" | "failed";
  payload: {
    groupId: string;
    content?: string;
    type?: "text" | "image" | "document";
    attachmentUrl?: string;
    attachmentName?: string;
    replyToMessageId?: string;
    clientRequestId?: string;
  };
  message: ChatMessage;
  error?: string;
};

type AttachmentDraft = {
  file: File;
  previewUrl?: string;
  progress: number;
  isUploading: boolean;
  uploadedUrl?: string;
  uploadedName?: string;
  error?: string;
};

type ReplyTarget = {
  id: string;
  senderName: string;
  contentPreview: string;
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function isRecentlyActive(lastMessageAt?: string, windowMs = 5 * 60 * 1000): boolean {
  if (!lastMessageAt) return false;
  const ts = new Date(lastMessageAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= windowMs;
}

export default function FloatingChat() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeMobilePane, setActiveMobilePane] = useState<"groups" | "chat">("groups");
  const [desktopTab, setDesktopTab] = useState<"chats" | "events" | "verified">("chats");
  const [groupSearch, setGroupSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState<"club" | "event">("event");
  const [newGroupEventId, setNewGroupEventId] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"recent" | "unread">("recent");
  const [collapsedSections, setCollapsedSections] = useState({ clubs: false, events: false });
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [membersSearch, setMembersSearch] = useState("");
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [outgoingMessages, setOutgoingMessages] = useState<OutgoingMessage[]>([]);
  const [attachmentDraft, setAttachmentDraft] = useState<AttachmentDraft | null>(null);
  const [showPinboard, setShowPinboard] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [mutedGroupIds, setMutedGroupIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const stored = window.localStorage.getItem("chat-muted-groups");
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
    } catch {
      return [];
    }
  });
  const [pulse, setPulse] = useState(false);
  const previousUnreadRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesViewportRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoCreateOwnClubRef = useRef<string | null>(null);
  const notificationStateRef = useRef<Record<string, { lastMessageAt: string; unreadCount: number }>>({});
  const notificationsInitializedRef = useRef(false);

  const { data: identity, isLoading: identityLoading } = useQuery<ChatIdentity>({
    queryKey: ["/api/chat/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/chat/me");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  const isLoggedIn = !!identity?.loggedIn;

  useEffect(() => {
    if (identityLoading) return;
    if (!identity?.loggedIn) {
      queryClient.removeQueries({ queryKey: ["/api/chat/groups"] });
      queryClient.removeQueries({ queryKey: ["/api/chat/unread-count"] });
      queryClient.removeQueries({ queryKey: ["/api/chat/groups", selectedGroupId, "messages"] });
    }
  }, [identity?.loggedIn, identityLoading, selectedGroupId]);

  const verifyChatAccess = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/chat/me`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        queryClient.setQueryData(["/api/chat/me"], { loggedIn: false, role: "guest" });
        return false;
      }

      const me = (await response.json()) as ChatIdentity;
      queryClient.setQueryData(["/api/chat/me"], me);
      return !!me?.loggedIn;
    } catch {
      queryClient.setQueryData(["/api/chat/me"], { loggedIn: false, role: "guest" });
      return false;
    }
  };

  const { data: unreadData } = useQuery<{ totalUnread: number }>({
    queryKey: ["/api/chat/unread-count"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/chat/unread-count");
      return response.json();
    },
    enabled: isLoggedIn,
    refetchInterval: 7000,
  });

  const { data: groupData, isLoading: groupsLoading } = useQuery<GroupResponse>({
    queryKey: ["/api/chat/groups"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/chat/groups");
      return response.json();
    },
    enabled: isLoggedIn,
    refetchInterval: isOpen ? 5000 : 12000,
  });

  const { data: allEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/events");
      return response.json();
    },
    enabled: isLoggedIn,
  });

  const { data: allClubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/clubs");
      return response.json();
    },
    enabled: isLoggedIn,
    refetchInterval: isOpen ? 25000 : false,
  });

  const { data: studentMemberships = [] } = useQuery<ClubMembership[]>({
    queryKey: ["/api/student/club-memberships"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/student/club-memberships");
      return response.json();
    },
    enabled: isLoggedIn && identity?.role === "student",
    refetchInterval: isOpen ? 15000 : false,
  });

  const { data: studentRegistrations = [] } = useQuery<EventRegistration[]>({
    queryKey: ["/api/student/registrations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/student/registrations");
      return response.json();
    },
    enabled: isLoggedIn && identity?.role === "student",
    refetchInterval: isOpen ? 15000 : false,
  });

  const groups = useMemo(
    () => [...(groupData?.sections.clubs || []), ...(groupData?.sections.events || [])],
    [groupData]
  );

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || null,
    [groups, selectedGroupId]
  );
  const activeGroupIds = useMemo(
    () => new Set(groups.filter((group) => isRecentlyActive(group.lastMessageAt)).map((group) => group.id)),
    [groups]
  );
  const isGroupActive = (group?: ChatGroup | null) => !!group && activeGroupIds.has(group.id);

  const normalizedSearch = groupSearch.trim().toLowerCase();
  const filteredClubGroups = useMemo(() => {
    const clubGroups = groupData?.sections.clubs || [];
    if (!normalizedSearch) return clubGroups;
    return clubGroups.filter((group) => group.name.toLowerCase().includes(normalizedSearch));
  }, [groupData?.sections.clubs, normalizedSearch]);

  const filteredEventGroups = useMemo(() => {
    const eventGroups = groupData?.sections.events || [];
    if (!normalizedSearch) return eventGroups;
    return eventGroups.filter((group) => group.name.toLowerCase().includes(normalizedSearch));
  }, [groupData?.sections.events, normalizedSearch]);

  const verifiedClubs = useMemo(() => {
    const sorted = [...allClubs].sort((a, b) => a.name.localeCompare(b.name));
    if (!normalizedSearch) return sorted;
    return sorted.filter((club) => club.name.toLowerCase().includes(normalizedSearch));
  }, [allClubs, normalizedSearch]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<ChatMessagesResponse>({
    queryKey: ["/api/chat/groups", selectedGroupId, "messages"],
    queryFn: async ({ pageParam }) => {
      const cursor = typeof pageParam === "string" ? pageParam : "";
      const qs = new URLSearchParams({ limit: "40" });
      if (cursor) qs.set("before", cursor);
      const response = await apiRequest("GET", `/api/chat/groups/${selectedGroupId}/messages?${qs.toString()}`);
      return response.json();
    },
    enabled: isLoggedIn && !!selectedGroupId,
    initialPageParam: "",
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor || undefined : undefined),
    refetchInterval: isOpen ? 3500 : false,
  });

  const messages = useMemo(
    () => messagesData?.pages.flatMap((page) => page.messages) || [],
    [messagesData]
  );

  const { data: pinnedData } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ["/api/chat/groups", selectedGroupId, "pinned"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/chat/groups/${selectedGroupId}/pinned`);
      return response.json();
    },
    enabled: isLoggedIn && !!selectedGroupId,
    refetchInterval: isOpen ? 9000 : false,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<ChatMembersResponse>({
    queryKey: ["/api/chat/groups", selectedGroupId, "members"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/chat/groups/${selectedGroupId}/members`);
      return response.json();
    },
    enabled: isLoggedIn && !!selectedGroupId && (identity?.role === "club_admin" || identity?.role === "university_admin"),
    refetchInterval: showMembersPanel ? 6000 : false,
  });

  const markReadMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("POST", `/api/chat/groups/${groupId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread-count"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: {
      groupId: string;
      content?: string;
      type?: "text" | "image" | "document";
      attachmentUrl?: string;
      attachmentName?: string;
      replyToMessageId?: string;
      clientRequestId?: string;
    }) => {
      const { groupId, ...body } = payload;
      const response = await apiRequest("POST", `/api/chat/groups/${groupId}/messages`, body);
      return response.json();
    },
    onSuccess: (savedMessage: ChatMessage) => {
      setDraft("");
      setReplyTarget(null);
      setAttachmentDraft((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
      if (savedMessage?.clientRequestId) {
        setOutgoingMessages((prev) => prev.filter((item) => item.payload.clientRequestId !== savedMessage.clientRequestId));
      }
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups", selectedGroupId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups", selectedGroupId, "pinned"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread-count"] });
    },
    onError: (error: any, payload) => {
      if (payload?.clientRequestId) {
        setOutgoingMessages((prev) =>
          prev.map((item) =>
            item.payload.clientRequestId === payload.clientRequestId
              ? { ...item, status: "failed", error: error?.message || "Message could not be sent" }
              : item
          )
        );
      }
      toast({
        title: "Unable to send message",
        description: error?.message || "Message could not be sent",
        variant: "destructive",
      });
    },
  });

  const updateChatSettingsMutation = useMutation({
    mutationFn: async (payload: { groupId: string; adminOnlyMessaging: boolean }) => {
      const { groupId, ...body } = payload;
      const response = await apiRequest("PATCH", `/api/chat/groups/${groupId}/settings`, {
        ...body,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups", selectedGroupId, "members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unable to update chat settings",
        description: error?.message || "Failed to update chat settings",
        variant: "destructive",
      });
    },
  });

  const moderateMemberMutation = useMutation({
    mutationFn: async (payload: { groupId: string; enrollmentNumber: string; action: "block" | "unblock" | "remove" }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/chat/groups/${payload.groupId}/members/${payload.enrollmentNumber}`,
        { action: payload.action }
      );
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups", variables.groupId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
      toast({
        title: "Member updated",
        description:
          variables.action === "remove"
            ? "Member removed from chat scope"
            : variables.action === "block"
              ? "Member blocked from sending messages"
              : "Member unblocked",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Moderation failed",
        description: error?.message || "Unable to update member",
        variant: "destructive",
      });
    },
  });

  const pinMessageMutation = useMutation({
    mutationFn: async (payload: { groupId: string; messageId: string; pinned: boolean }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/chat/groups/${payload.groupId}/messages/${payload.messageId}/pin`,
        { pinned: payload.pinned }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups", selectedGroupId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unable to pin message",
        description: error?.message || "Failed to update pin status",
        variant: "destructive",
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (payload: { groupId: string; messageId: string }) => {
      const response = await apiRequest(
        "DELETE",
        `/api/chat/groups/${payload.groupId}/messages/${payload.messageId}`
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups", selectedGroupId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Unable to delete message",
        description: error?.message || "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (payload: { name?: string; type: "club" | "event"; eventId?: string; clubId?: string }) => {
      const response = await apiRequest("POST", "/api/chat/groups", payload);
      return response.json();
    },
    onSuccess: (group: ChatGroup) => {
      setNewGroupName("");
      setNewGroupEventId("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
      setSelectedGroupId(group.id);
      if (isMobile) {
        setActiveMobilePane("chat");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Unable to create chat",
        description: error?.message || "You may not have access to create this chat.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!selectedGroupId && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!isOpen) {
      setActiveMobilePane("groups");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsOpen(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isOpen && selectedGroupId) {
      markReadMutation.mutate(selectedGroupId);
    }
  }, [isOpen, selectedGroupId]);

  useEffect(() => {
    setShowMembersPanel(false);
    setMembersSearch("");
    setReplyTarget(null);
    setOutgoingMessages([]);
    setShowPinboard(false);
    setAttachmentDraft((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, [selectedGroupId]);

  useEffect(() => {
    if (!messagesViewportRef.current) return;
    const container = messagesViewportRef.current;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 180;
    if (nearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, outgoingMessages.length]);

  useEffect(() => {
    return () => {
      if (attachmentDraft?.previewUrl) {
        URL.revokeObjectURL(attachmentDraft.previewUrl);
      }
    };
  }, [attachmentDraft?.previewUrl]);

  useEffect(() => {
    const totalUnread = unreadData?.totalUnread || 0;
    if (totalUnread > previousUnreadRef.current) {
      setPulse(true);
      previousUnreadRef.current = totalUnread;
      const timer = window.setTimeout(() => setPulse(false), 1200);
      return () => window.clearTimeout(timer);
    }
    previousUnreadRef.current = totalUnread;
  }, [unreadData?.totalUnread]);

  useEffect(() => {
    if (!isLoggedIn || !groupData) return;

    const allGroups = [...(groupData.sections.clubs || []), ...(groupData.sections.events || [])];
    if (allGroups.length === 0) return;

    const nextState: Record<string, { lastMessageAt: string; unreadCount: number }> = {};
    for (const group of allGroups) {
      nextState[group.id] = {
        lastMessageAt: group.lastMessageAt,
        unreadCount: group.unreadCount,
      };
    }

    if (!notificationsInitializedRef.current) {
      notificationStateRef.current = nextState;
      notificationsInitializedRef.current = true;
      return;
    }

    const oldState = notificationStateRef.current;
    const incomingGroups = allGroups.filter((group) => {
      if (mutedGroupIds.includes(group.id)) return false;

      const previous = oldState[group.id];
      if (!previous) return group.unreadCount > 0;

      const becameNewer = new Date(group.lastMessageAt).getTime() > new Date(previous.lastMessageAt).getTime();
      const unreadIncreased = group.unreadCount > previous.unreadCount;
      return group.unreadCount > 0 && (becameNewer || unreadIncreased);
    });

    incomingGroups.slice(0, 2).forEach((group) => {
      const preview = group.lastMessagePreview || "You have a new message";
      toast({
        title: `New message in ${group.name}`,
        description: preview,
      });
    });

    notificationStateRef.current = nextState;
  }, [groupData, isLoggedIn, toast, mutedGroupIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("chat-muted-groups", JSON.stringify(mutedGroupIds));
  }, [mutedGroupIds]);

  const enqueueOptimisticMessage = (payload: OutgoingMessage["payload"], senderName: string) => {
    const tempId = payload.clientRequestId || `temp-${Date.now()}`;

    const optimistic: OutgoingMessage = {
      tempId,
      status: "sending",
      payload,
      message: {
        id: tempId,
        chatGroupId: payload.groupId,
        senderType: identity?.userType || "student",
        senderId: identity?.userId || "self",
        senderName,
        content: payload.content || "",
        type: payload.type || "text",
        attachmentUrl: payload.attachmentUrl,
        attachmentName: payload.attachmentName,
        replyToMessageId: payload.replyToMessageId,
        replyToSenderName: replyTarget?.senderName,
        replyToContentPreview: replyTarget?.contentPreview,
        clientRequestId: payload.clientRequestId,
        createdAt: new Date().toISOString(),
      },
    };

    setOutgoingMessages((prev) => [...prev, optimistic]);
    return { tempId };
  };

  const sendPayload = (payload: OutgoingMessage["payload"]) => {
    enqueueOptimisticMessage(payload, identity?.displayName || "You");
    sendMessageMutation.mutate(payload);
  };

  const handleSendMessage = async () => {
    if (!selectedGroupId || sendMessageMutation.isPending) return;
    const hasText = !!draft.trim();
    if (!hasText && !attachmentDraft) return;

    const clientRequestId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    let attachmentUrl = attachmentDraft?.uploadedUrl;
    let attachmentName = attachmentDraft?.uploadedName || attachmentDraft?.file.name;
    let type: "text" | "image" | "document" = "text";

    if (attachmentDraft) {
      try {
        setAttachmentDraft((prev) => (prev ? { ...prev, isUploading: true, error: undefined } : prev));

        if (!attachmentUrl) {
          const uploaded = await uploadChatAttachment({
            groupId: selectedGroupId,
            file: attachmentDraft.file,
            onProgress: (percent) => {
              setAttachmentDraft((prev) => (prev ? { ...prev, progress: percent } : prev));
            },
          });
          attachmentUrl = uploaded.url;
          attachmentName = uploaded.filename || attachmentDraft.file.name;
        }

        type = attachmentDraft.file.type.startsWith("image/") ? "image" : "document";
      } catch (error: any) {
        setAttachmentDraft((prev) =>
          prev
            ? {
                ...prev,
                isUploading: false,
                error: error?.message || "Attachment upload failed",
              }
            : prev
        );
        return;
      }
    }

    sendPayload({
      groupId: selectedGroupId,
      content: draft.trim(),
      type,
      attachmentUrl,
      attachmentName,
      replyToMessageId: replyTarget?.id,
      clientRequestId,
    });
  };

  const handleAttachClick = () => {
    if (studentBlockedInSelectedGroup || studentBlockedByAdminOnly) return;
    fileInputRef.current?.click();
  };

  const handleAttachmentSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedGroupId || !event.target.files || event.target.files.length === 0) return;
    if (studentBlockedInSelectedGroup || studentBlockedByAdminOnly) {
      event.target.value = "";
      return;
    }

    const file = event.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Large file",
        description: "Maximum attachment size is 5 MB.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setAttachmentDraft({
      file,
      previewUrl,
      progress: 0,
      isUploading: false,
    });
    event.target.value = "";
  };

  const handleRetryFailedMessage = (outgoing: OutgoingMessage) => {
    setOutgoingMessages((prev) => prev.filter((item) => item.tempId !== outgoing.tempId));
    sendPayload({ ...outgoing.payload, clientRequestId: `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  };

  const retryAttachmentUpload = async () => {
    if (!selectedGroupId || !attachmentDraft) return;
    try {
      setAttachmentDraft((prev) => (prev ? { ...prev, isUploading: true, error: undefined, progress: 0 } : prev));
      const uploaded = await uploadChatAttachment({
        groupId: selectedGroupId,
        file: attachmentDraft.file,
        onProgress: (percent) => {
          setAttachmentDraft((prev) => (prev ? { ...prev, progress: percent } : prev));
        },
      });
      setAttachmentDraft((prev) =>
        prev
          ? {
              ...prev,
              isUploading: false,
              uploadedUrl: uploaded.url,
              uploadedName: uploaded.filename || prev.file.name,
              progress: 100,
              error: undefined,
            }
          : prev
      );
    } catch (error: any) {
      setAttachmentDraft((prev) =>
        prev
          ? {
              ...prev,
              isUploading: false,
              error: error?.message || "Attachment upload failed",
            }
          : prev
      );
    }
  };

  const handleCreateGroup = () => {
    if (createGroupMutation.isPending) return;

    if (newGroupType === "event") {
      if (!newGroupEventId) return;
      createGroupMutation.mutate({
        type: "event",
        eventId: newGroupEventId,
        name: newGroupName.trim() || undefined,
      });
      return;
    }

    if (identity?.role === "club_admin" && !identity.clubId) {
      toast({
        title: "Club mapping missing",
        description: "Your admin account is not linked to a club. Contact university admin.",
        variant: "destructive",
      });
      return;
    }

    createGroupMutation.mutate({
      type: "club",
      clubId: identity?.role === "club_admin" ? identity.clubId : undefined,
      name: newGroupName.trim() || undefined,
    });
  };

  const filteredEvents = useMemo(() => {
    if (!identity?.canCreateGroup) return [];
    if (identity.role === "club_admin") {
      return allEvents.filter((event) => event.clubId === identity.clubId);
    }
    return allEvents;
  }, [allEvents, identity]);

  const unreadCount = unreadData?.totalUnread ?? groupData?.totalUnread ?? 0;

  const clubGroupByClubId = useMemo(() => {
    return new Map<string, ChatGroup>(
      (groupData?.sections.clubs || [])
        .filter((group): group is ChatGroup & { clubId: string } => !!group.clubId)
        .map((group) => [group.clubId, group] as const)
    );
  }, [groupData?.sections.clubs]);

  const eventGroupByEventId = useMemo(() => {
    return new Map<string, ChatGroup>(
      (groupData?.sections.events || [])
        .filter((group): group is ChatGroup & { eventId: string } => !!group.eventId)
        .map((group) => [group.eventId, group] as const)
    );
  }, [groupData?.sections.events]);

  const visibleClubs = useMemo(() => {
    const allowedClubIds = new Set(
      studentMemberships
        .filter((membership) => membership.status === "approved")
        .map((membership) => membership.clubId)
    );

    const sorted = [...allClubs].sort((a, b) => a.name.localeCompare(b.name));
    const roleFiltered =
      identity?.role === "student"
        ? sorted.filter((club) => allowedClubIds.has(club.id))
        : sorted;

    if (!normalizedSearch) return roleFiltered;
    return roleFiltered.filter((club) => club.name.toLowerCase().includes(normalizedSearch));
  }, [allClubs, normalizedSearch, identity?.role, studentMemberships]);

  const visibleEvents = useMemo(() => {
    const allowedEventIds = new Set(
      studentRegistrations
        .filter((registration) => registration.status !== "rejected")
        .map((registration) => registration.eventId)
    );

    const sorted = [...allEvents].sort((a, b) => a.title.localeCompare(b.title));
    const roleFiltered =
      identity?.role === "student"
        ? sorted.filter((event) => allowedEventIds.has(event.id))
        : sorted;

    if (!normalizedSearch) return roleFiltered;
    return roleFiltered.filter((event) => event.title.toLowerCase().includes(normalizedSearch));
  }, [allEvents, normalizedSearch, identity?.role, studentRegistrations]);

  const allowedStudentClubIds = useMemo(
    () =>
      new Set(
        studentMemberships
          .filter((membership) => membership.status === "approved")
          .map((membership) => membership.clubId)
      ),
    [studentMemberships]
  );

  const allowedStudentEventIds = useMemo(
    () =>
      new Set(
        studentRegistrations
          .filter((registration) => registration.status !== "rejected")
          .map((registration) => registration.eventId)
      ),
    [studentRegistrations]
  );

  const studentEventStatusByEventId = useMemo(() => {
    const map = new Map<string, "pending" | "approved">();

    for (const registration of studentRegistrations) {
      if (registration.status === "rejected") continue;
      if (registration.status === "approved") {
        map.set(registration.eventId, "approved");
      } else if (!map.has(registration.eventId)) {
        map.set(registration.eventId, "pending");
      }
    }

    return map;
  }, [studentRegistrations]);

  const clubById = useMemo(() => {
    return new Map<string, Club>(allClubs.map((club) => [club.id, club]));
  }, [allClubs]);

  const eventById = useMemo(() => {
    return new Map<string, Event>(allEvents.map((event) => [event.id, event]));
  }, [allEvents]);

  useEffect(() => {
    if (identity?.role !== "club_admin" || !identity.clubId) return;

    const ownGroup = clubGroupByClubId.get(identity.clubId);
    if (ownGroup) {
      autoCreateOwnClubRef.current = null;
      return;
    }

    if (createGroupMutation.isPending) return;
    if (autoCreateOwnClubRef.current === identity.clubId) return;

    autoCreateOwnClubRef.current = identity.clubId;
    createGroupMutation.mutate({
      type: "club",
      clubId: identity.clubId,
      name: `${clubById.get(identity.clubId)?.name || "My Club"} Club Chat`,
    });
  }, [identity?.role, identity?.clubId, clubGroupByClubId, createGroupMutation.isPending, clubById]);

  const myClubGroups = useMemo(() => {
    const clubGroups = filteredClubGroups;

    if (identity?.role === "student") {
      return clubGroups.filter((group) => !!group.clubId && allowedStudentClubIds.has(group.clubId));
    }

    if (identity?.role === "club_admin") {
      return clubGroups.filter((group) => group.clubId === identity.clubId);
    }

    return clubGroups;
  }, [filteredClubGroups, identity?.role, identity?.clubId, allowedStudentClubIds]);

  const myEventGroups = useMemo(() => {
    const eventGroups = filteredEventGroups;

    if (identity?.role === "student") {
      return eventGroups.filter((group) => !!group.eventId && allowedStudentEventIds.has(group.eventId));
    }

    if (identity?.role === "club_admin") {
      return eventGroups.filter((group) => group.clubId === identity.clubId);
    }

    return eventGroups;
  }, [filteredEventGroups, identity?.role, identity?.clubId, allowedStudentEventIds]);

  const displayedClubGroups = useMemo(() => {
    const next = [...myClubGroups];

    if (showUnreadOnly) {
      return next.filter((group) => group.unreadCount > 0);
    }

    if (sortMode === "unread") {
      return next.sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
    }

    return next.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [myClubGroups, showUnreadOnly, sortMode]);

  const displayedEventGroups = useMemo(() => {
    const next = [...myEventGroups];

    if (showUnreadOnly) {
      return next.filter((group) => group.unreadCount > 0);
    }

    if (sortMode === "unread") {
      return next.sort((a, b) => {
        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
    }

    return next.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [myEventGroups, showUnreadOnly, sortMode]);

  const myClubUnreadCount = useMemo(
    () => myClubGroups.reduce((sum, group) => sum + (group.unreadCount || 0), 0),
    [myClubGroups]
  );

  const myEventUnreadCount = useMemo(
    () => myEventGroups.reduce((sum, group) => sum + (group.unreadCount || 0), 0),
    [myEventGroups]
  );

  const pinnedMyClubGroup = useMemo(() => {
    if (identity?.role !== "club_admin" || !identity.clubId) return null;
    return myClubGroups.find((group) => group.clubId === identity.clubId) || null;
  }, [identity?.role, identity?.clubId, myClubGroups]);

  const getInitials = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("");

  const renderEntityAvatar = (params: { imageUrl?: string; label: string; fallback?: string }) => {
    const { imageUrl, label, fallback } = params;

    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={label}
          className="h-10 w-10 rounded-xl border border-border/70 object-cover"
        />
      );
    }

    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-primary/15 text-xs font-semibold text-primary">
        {fallback || getInitials(label)}
      </span>
    );
  };

  const selectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    if (isMobile) {
      setActiveMobilePane("chat");
    }
  };

  const openOrCreateClubChat = (club: Club) => {
    if (identity?.role === "student" && !allowedStudentClubIds.has(club.id)) {
      toast({
        title: "Not joined",
        description: "You can only access chats for clubs you have joined.",
        variant: "destructive",
      });
      return;
    }

    const existingGroup = clubGroupByClubId.get(club.id);
    if (existingGroup) {
      selectGroup(existingGroup.id);
      return;
    }

    if (identity?.role === "club_admin" && identity.clubId !== club.id) {
      toast({
        title: "Not allowed",
        description: "Club admins can only create chats for their own club.",
        variant: "destructive",
      });
      return;
    }

    if (!identity?.canCreateGroup) {
      toast({
        title: "Chat not created yet",
        description: "Ask a club or university admin to create this club chat.",
      });
      return;
    }

    createGroupMutation.mutate({
      type: "club",
      clubId: club.id,
      name: `${club.name} Club Chat`,
    });
  };

  const openOrCreateEventChat = (event: Event) => {
    if (identity?.role === "student" && !allowedStudentEventIds.has(event.id)) {
      toast({
        title: "Not enrolled",
        description: "You can only access chats for events you are enrolled in.",
        variant: "destructive",
      });
      return;
    }

    const existingGroup = eventGroupByEventId.get(event.id);
    if (existingGroup) {
      selectGroup(existingGroup.id);
      return;
    }

    if (identity?.role === "club_admin" && identity.clubId !== event.clubId) {
      toast({
        title: "Not allowed",
        description: "Club admins can only create chats for their own club events.",
        variant: "destructive",
      });
      return;
    }

    if (!identity?.canCreateGroup) {
      toast({
        title: "Chat not created yet",
        description: "Ask a club or university admin to create this event chat.",
      });
      return;
    }

    createGroupMutation.mutate({
      type: "event",
      eventId: event.id,
      name: `${event.title} Event Chat`,
    });
  };

  useEffect(() => {
    const handler = (evt: globalThis.Event) => {
      const customEvent = evt as CustomEvent<ChatOpenPayload>;
      const detail = customEvent.detail || {};

      if (!isLoggedIn) {
        toast({
          title: "Login required",
          description: "Please login to access chats.",
          variant: "destructive",
        });
        return;
      }

      setIsOpen(true);

      if (detail.tab) {
        setDesktopTab(detail.tab);
        if (detail.tab === "events") {
          setActiveMobilePane("groups");
        }
      }

      if (detail.clubId) {
        const club = allClubs.find((item) => item.id === detail.clubId);
        if (club) {
          openOrCreateClubChat(club);
        }
        return;
      }

      if (detail.eventId) {
        const event = allEvents.find((item) => item.id === detail.eventId);
        if (event) {
          openOrCreateEventChat(event);
        }
      }
    };

    window.addEventListener("open-floating-chat", handler as EventListener);
    return () => window.removeEventListener("open-floating-chat", handler as EventListener);
  }, [isLoggedIn, allClubs, allEvents, toast, openOrCreateClubChat, openOrCreateEventChat]);

  const canModerateSelectedGroup =
    !!selectedGroup &&
    (identity?.role === "university_admin" ||
      (identity?.role === "club_admin" && !!identity.clubId && selectedGroup.clubId === identity.clubId));

  const studentBlockedInSelectedGroup =
    identity?.role === "student" &&
    !!membersData?.members?.some((member) => member.userKey === `student:${identity.enrollmentNumber}` && member.blocked);

  const studentBlockedByAdminOnly = identity?.role === "student" && !!selectedGroup?.adminOnlyMessaging;

  const isSendDisabled =
    !selectedGroupId ||
    (!draft.trim() && !attachmentDraft) ||
    sendMessageMutation.isPending ||
    !!attachmentDraft?.isUploading ||
    !!studentBlockedInSelectedGroup ||
    !!studentBlockedByAdminOnly;

  const normalizedMembersSearch = membersSearch.trim().toLowerCase();

  const filteredMembers = useMemo(() => {
    const members = membersData?.members || [];
    if (!normalizedMembersSearch) return members;

    return members.filter((member) => {
      return (
        member.name.toLowerCase().includes(normalizedMembersSearch) ||
        member.enrollmentNumber.toLowerCase().includes(normalizedMembersSearch) ||
        member.email.toLowerCase().includes(normalizedMembersSearch)
      );
    });
  }, [membersData?.members, normalizedMembersSearch]);
  const isSelectedGroupMuted = !!selectedGroup && mutedGroupIds.includes(selectedGroup.id);

  const mergedMessages = useMemo(() => {
    const serverMap = new Map<string, ChatMessage>();
    for (const message of messages) {
      serverMap.set(message.id, message);
      if (message.clientRequestId) {
        serverMap.set(`client:${message.clientRequestId}`, message);
      }
    }

    const optimisticMessages = outgoingMessages
      .filter((item) => !serverMap.has(`client:${item.payload.clientRequestId}`))
      .map((item) => ({
        ...item.message,
        content:
          item.status === "failed"
            ? `${item.message.content || "Message"} (failed)`
            : item.message.content,
      }));

    return [...messages, ...optimisticMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages, outgoingMessages]);

  const outgoingByMessageId = useMemo(
    () => new Map(outgoingMessages.map((item) => [item.message.id, item] as const)),
    [outgoingMessages]
  );

  const pinnedMessage = useMemo(() => {
    const pinned = (pinnedData?.messages || []).filter((message) => !message.deleted);
    if (pinned.length === 0) return null;

    return pinned.sort((a, b) => {
      const aTime = new Date(a.pinnedAt || a.createdAt).getTime();
      const bTime = new Date(b.pinnedAt || b.createdAt).getTime();
      return bTime - aTime;
    })[0];
  }, [pinnedData?.messages]);

  const canPinOrDeleteMessage = (message: ChatMessage) => {
    if (canModerateSelectedGroup) return true;
    return message.senderType === identity?.userType && message.senderId === identity?.userId;
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    const contentPreview =
      message.content?.trim() ||
      (message.type === "image"
        ? "[Image]"
        : message.attachmentName
          ? `[Attachment] ${message.attachmentName}`
          : "[Attachment]");

    setReplyTarget({
      id: message.id,
      senderName: message.senderName,
      contentPreview,
    });
  };

  const handleTogglePinMessage = (message: ChatMessage) => {
    if (!selectedGroup || !canPinOrDeleteMessage(message)) return;

    pinMessageMutation.mutate({
      groupId: selectedGroup.id,
      messageId: message.id,
      pinned: !message.isPinned,
    });
  };

  const handleDeleteMessage = (message: ChatMessage) => {
    if (!selectedGroup || !canPinOrDeleteMessage(message) || message.deleted) return;

    deleteMessageMutation.mutate({
      groupId: selectedGroup.id,
      messageId: message.id,
    });
  };

  const toggleMuteGroup = (groupId: string) => {
    setMutedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleMessagesScroll = () => {
    const container = messagesViewportRef.current;
    if (!container) return;

    if (container.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowJumpToLatest(distanceFromBottom > 300);
  };

  const jumpToLatest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowJumpToLatest(false);
  };

  const uploadChatAttachment = (params: { groupId: string; file: File; onProgress: (percent: number) => void }) =>
    new Promise<{ url: string; filename?: string; mimeType?: string }>((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", params.file);
      formData.append("groupId", params.groupId);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${import.meta.env.VITE_API_URL || ""}/api/chat/upload`, true);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.round((event.loaded / event.total) * 100);
        params.onProgress(percent);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid upload response"));
          }
          return;
        }

        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body?.error || "Attachment upload failed"));
        } catch {
          reject(new Error("Attachment upload failed"));
        }
      };

      xhr.onerror = () => reject(new Error("Attachment upload failed"));
      xhr.send(formData);
    });

  const GroupsSidebar = (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-background via-background to-muted/40">
      <div className="space-y-3 border-b bg-background/90 p-4 backdrop-blur">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            placeholder="Search clubs and chats"
            className="h-10 border-0 bg-transparent px-0 focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={showUnreadOnly ? "default" : "outline"}
            className="h-8"
            onClick={() => setShowUnreadOnly((prev) => !prev)}
          >
            Unread only
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setSortMode((prev) => (prev === "recent" ? "unread" : "recent"))}
          >
            Sort: {sortMode === "recent" ? "Recent" : "Unread"}
          </Button>
        </div>

      </div>

      {identity?.role === "club_admin" && (
        <div className="border-b border-border/70 bg-background/95 p-3 backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Pin className="h-3 w-3" /> My Club Chat
          </div>

          {pinnedMyClubGroup ? (
            <button
              type="button"
              onClick={() => selectGroup(pinnedMyClubGroup.id)}
              className={[
                "w-full rounded-2xl border p-3 text-left transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md",
                selectedGroupId === pinnedMyClubGroup.id
                  ? "border-primary/70 bg-primary/10 shadow-sm"
                  : "border-primary/30 bg-primary/5 hover:bg-primary/10",
              ].join(" ")}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {renderEntityAvatar({
                    imageUrl:
                      pinnedMyClubGroup.clubId ? clubById.get(pinnedMyClubGroup.clubId)?.logoUrl : undefined,
                    label: pinnedMyClubGroup.name,
                    fallback: "#",
                  })}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{pinnedMyClubGroup.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{pinnedMyClubGroup.lastMessagePreview}</p>
                    {isGroupActive(pinnedMyClubGroup) && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active now
                      </p>
                    )}
                  </div>
                </div>
                {pinnedMyClubGroup.unreadCount > 0 && (
                  <Badge className="bg-emerald-600">{pinnedMyClubGroup.unreadCount}</Badge>
                )}
              </div>
            </button>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 p-3 text-xs text-muted-foreground">
              Preparing your club chat...
            </div>
          )}
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          <button
            type="button"
            onClick={() =>
              setCollapsedSections((prev) => ({
                ...prev,
                clubs: !prev.clubs,
              }))
            }
            className="flex w-full items-center justify-between px-1 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1">
              {collapsedSections.clubs ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              My Clubs ({myClubGroups.length})
            </span>
            {myClubUnreadCount > 0 && <Badge className="bg-emerald-600">{myClubUnreadCount}</Badge>}
          </button>

          {!collapsedSections.clubs && displayedClubGroups.map((group, index) => (
            <button
              key={group.id}
              type="button"
              onClick={() => selectGroup(group.id)}
              className={[
                "w-full rounded-2xl border p-3 text-left transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md",
                selectedGroupId === group.id
                  ? "border-primary/70 bg-primary/10 shadow-sm"
                  : "border-border/70 bg-card/70 hover:bg-card",
                index < 3 ? "animate-in fade-in-50 slide-in-from-left-1" : "",
              ].join(" ")}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {renderEntityAvatar({
                    imageUrl: group.clubId ? clubById.get(group.clubId)?.logoUrl : undefined,
                    label: group.name,
                    fallback: "#",
                  })}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{group.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{group.lastMessagePreview}</p>
                  </div>
                </div>
                {group.unreadCount > 0 && <Badge className="bg-emerald-600">{group.unreadCount}</Badge>}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {group.membersCount} members
                  </span>
                  {isGroupActive(group) && (
                    <span className="inline-flex items-center gap-1 text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                    </span>
                  )}
                </div>
                <span>{formatTime(group.lastMessageAt)}</span>
              </div>
            </button>
          ))}

          {!groupsLoading && !collapsedSections.clubs && displayedClubGroups.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              {showUnreadOnly ? "No unread club chats." : "No club chats yet."}
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setCollapsedSections((prev) => ({
                ...prev,
                events: !prev.events,
              }))
            }
            className="mt-4 flex w-full items-center justify-between px-1 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1">
              {collapsedSections.events ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              My Events ({myEventGroups.length})
            </span>
            {myEventUnreadCount > 0 && <Badge className="bg-emerald-600">{myEventUnreadCount}</Badge>}
          </button>

          {!collapsedSections.events && displayedEventGroups.map((group, index) => {
            const event = group.eventId ? eventById.get(group.eventId) : undefined;
            const studentEventStatus =
              identity?.role === "student" && group.eventId
                ? studentEventStatusByEventId.get(group.eventId)
                : undefined;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => selectGroup(group.id)}
                className={[
                  "w-full rounded-2xl border p-3 text-left transition-all duration-200",
                  "hover:-translate-y-0.5 hover:shadow-md",
                  selectedGroupId === group.id
                    ? "border-primary/70 bg-primary/10 shadow-sm"
                    : "border-border/70 bg-card/70 hover:bg-card",
                  index < 3 ? "animate-in fade-in-50 slide-in-from-left-1" : "",
                ].join(" ")}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {renderEntityAvatar({
                      imageUrl: event?.imageUrl || (group.clubId ? clubById.get(group.clubId)?.logoUrl : undefined),
                      label: group.name,
                      fallback: "EV",
                    })}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{group.name}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{group.lastMessagePreview}</p>
                    </div>
                  </div>
                  {group.unreadCount > 0 && <Badge className="bg-emerald-600">{group.unreadCount}</Badge>}
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="inline-flex items-center gap-1">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" /> {group.membersCount} members
                    </span>
                    {isGroupActive(group) && (
                      <span className="inline-flex items-center gap-1 text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                      </span>
                    )}
                    {studentEventStatus && (
                      <Badge
                        variant="outline"
                        className={[
                          "ml-1 h-5 px-1.5 text-[10px]",
                          studentEventStatus === "approved"
                            ? "border-emerald-500/50 text-emerald-400"
                            : "border-amber-500/50 text-amber-400",
                        ].join(" ")}
                      >
                        {studentEventStatus === "approved" ? "Approved" : "Pending"}
                      </Badge>
                    )}
                  </div>
                  <span>{formatTime(group.lastMessageAt)}</span>
                </div>
              </button>
            );
          })}

          {!groupsLoading && !collapsedSections.events && displayedEventGroups.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              {showUnreadOnly ? "No unread event chats." : "No event chats yet."}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const EventsSidebar = (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-background via-background to-muted/40">
      <div className="border-b bg-background/90 p-4 backdrop-blur">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            placeholder="Search events"
            className="h-10 border-0 bg-transparent px-0 focus-visible:ring-0"
          />
        </div>

        {identity?.role !== "student" && identity?.canCreateGroup && (
          <div className="mt-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Quick Create
            </div>
            <div className="mb-2 flex gap-2">
              <Button
                type="button"
                variant={newGroupType === "club" ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => setNewGroupType("club")}
              >
                Club
              </Button>
              <Button
                type="button"
                variant={newGroupType === "event" ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => setNewGroupType("event")}
              >
                Event
              </Button>
            </div>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder={newGroupType === "club" ? "Club chat name" : "Event chat name"}
              className="mb-2 h-9"
            />
            {newGroupType === "event" && (
              <select
                value={newGroupEventId}
                onChange={(e) => setNewGroupEventId(e.target.value)}
                className="mb-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select event</option>
                {filteredEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            )}
            <Button type="button" size="sm" className="h-9 w-full" onClick={handleCreateGroup}>
              Create Group
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {visibleEvents.map((event, index) => {
            const group = eventGroupByEventId.get(event.id);
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => openOrCreateEventChat(event)}
                className={[
                  "w-full rounded-2xl border p-3 text-left transition-all duration-200",
                  "hover:-translate-y-0.5 hover:shadow-md",
                  group && selectedGroupId === group.id
                    ? "border-primary/70 bg-primary/10 shadow-sm"
                    : "border-border/70 bg-card/70 hover:bg-card",
                  index < 3 ? "animate-in fade-in-50 slide-in-from-left-1" : "",
                ].join(" ")}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {renderEntityAvatar({
                      imageUrl: event.imageUrl || clubById.get(event.clubId)?.logoUrl,
                      label: event.title,
                      fallback: "EV",
                    })}
                    <p className="truncate text-sm font-semibold">{event.title}</p>
                  </div>
                  {group?.unreadCount ? <Badge className="bg-emerald-600">{group.unreadCount}</Badge> : null}
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {group ? group.lastMessagePreview : "Tap to create or open event chat"}
                </p>
              </button>
            );
          })}

          {!groupsLoading && visibleEvents.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              No events found.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const VerifiedSidebar = (
    <div className="flex h-full min-h-0 flex-col bg-gradient-to-b from-background via-background to-muted/40">
      <div className="border-b bg-background/90 p-4 backdrop-blur">
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={groupSearch}
            onChange={(e) => setGroupSearch(e.target.value)}
            placeholder="Search verified clubs"
            className="h-10 border-0 bg-transparent px-0 focus-visible:ring-0"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="grid grid-cols-1 gap-2 p-3">
          {verifiedClubs.map((club) => (
            <button
              key={club.id}
              type="button"
              onClick={() => openOrCreateClubChat(club)}
              className="group flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-2">
                {renderEntityAvatar({
                  imageUrl: club.logoUrl,
                  label: club.name,
                })}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{club.name}</p>
                  <p className="text-xs text-muted-foreground">Verified community</p>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const ChatPane = selectedGroup ? (
    <div className="relative flex h-full min-h-0 flex-col bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.10),_transparent_45%)]">
      <div className="border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {isMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setActiveMobilePane("groups")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {renderEntityAvatar({
              imageUrl:
                (selectedGroup.type === "club" ? selectedGroup.clubId && clubById.get(selectedGroup.clubId)?.logoUrl : undefined) ||
                (selectedGroup.type === "event"
                  ? eventById.get(selectedGroup.eventId || "")?.imageUrl ||
                    clubById.get(selectedGroup.clubId || "")?.logoUrl
                  : undefined),
              label: selectedGroup.name,
              fallback: selectedGroup.type === "event" ? "EV" : "#",
            })}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{selectedGroup.name}</p>
              <p className="text-xs text-muted-foreground">{selectedGroup.membersCount} members</p>
            </div>
          </div>
          <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
            {canModerateSelectedGroup && (
              <>
                <Button
                  type="button"
                  variant={membersData?.adminOnlyMessaging ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    updateChatSettingsMutation.mutate({
                      groupId: selectedGroup.id,
                      adminOnlyMessaging: !membersData?.adminOnlyMessaging,
                    })
                  }
                  disabled={updateChatSettingsMutation.isPending}
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {membersData?.adminOnlyMessaging ? "Admins only" : "Everyone can send"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setShowMembersPanel((prev) => !prev)}
                >
                  <UserCog className="mr-1 h-3 w-3" /> Members
                </Button>
              </>
            )}
            <Badge
              variant="outline"
              className={[
                "hidden sm:inline-flex",
                isGroupActive(selectedGroup)
                  ? "border-emerald-500/50 text-emerald-500"
                  : "border-border/70 text-muted-foreground",
              ].join(" ")}
            >
              <Users className="mr-1 h-3 w-3" /> {isGroupActive(selectedGroup) ? "Active now" : "Quiet"}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => toggleMuteGroup(selectedGroup.id)}
                >
                  {isSelectedGroupMuted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isSelectedGroupMuted ? "Unmute notifications for this chat" : "Mute notifications for this chat"}
              </TooltipContent>
            </Tooltip>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowPinboard((prev) => !prev)}
            >
              <Pin className="mr-1 h-3 w-3" /> Pins
            </Button>
          </div>
        </div>

        {pinnedMessage && (
          <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-amber-700 dark:text-amber-300">Pinned: {pinnedMessage.senderName}</p>
                <p className="truncate text-muted-foreground">
                  {pinnedMessage.content || pinnedMessage.attachmentName || "Pinned message"}
                </p>
              </div>
              {canPinOrDeleteMessage(pinnedMessage) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleTogglePinMessage(pinnedMessage)}
                  disabled={pinMessageMutation.isPending}
                >
                  <PinOff className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}

      </div>

      <div
        ref={messagesViewportRef}
        onScroll={handleMessagesScroll}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4"
      >
        <div className="space-y-3">
          {(hasNextPage || isFetchingNextPage) && (
            <div className="flex justify-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                {isFetchingNextPage ? "Loading older messages..." : "Load older messages"}
              </Button>
            </div>
          )}

          {messagesLoading && (
            <>
              <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-muted/70" />
              <div className="ml-auto h-16 w-1/2 animate-pulse rounded-2xl bg-muted/70" />
            </>
          )}

          {!messagesLoading && mergedMessages.length === 0 && (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border/70 bg-card/60 p-5 text-center text-sm text-muted-foreground">
              No messages yet. Start the first conversation.
            </div>
          )}

          {mergedMessages.map((message) => {
            const isOwn =
              message.senderType === identity?.userType &&
              message.senderId === identity?.userId;
            const canModerateMessage = canPinOrDeleteMessage(message);
            const outgoing = outgoingByMessageId.get(message.id);
            const isSystem = !!message.isSystem;

            return (
              <div
                key={message.id}
                className={[
                  "max-w-[88%] rounded-2xl border px-3 py-2 text-sm shadow-sm transition-all duration-200 sm:max-w-[78%]",
                  "animate-in fade-in-50 slide-in-from-bottom-1",
                  isSystem
                    ? "mx-auto border-amber-300/50 bg-amber-100/40 text-amber-900 dark:border-amber-600/50 dark:bg-amber-900/20 dark:text-amber-100"
                    : isOwn
                    ? "ml-auto border-primary/30 bg-primary text-primary-foreground"
                    : "border-border/70 bg-card/90",
                ].join(" ")}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold opacity-80">
                  <span>{message.senderName}</span>
                  {!message.deleted && !isSystem && (
                    <span className="inline-flex items-center gap-1 opacity-70">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleReplyToMessage(message)}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                      {canModerateMessage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleTogglePinMessage(message)}
                          disabled={pinMessageMutation.isPending}
                        >
                          {message.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                        </Button>
                      )}
                      {canModerateMessage && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleDeleteMessage(message)}
                          disabled={deleteMessageMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </span>
                  )}
                </div>

                {!!message.replyToMessageId && !message.deleted && (
                  <div className="mb-2 rounded-lg border border-current/25 bg-black/10 px-2 py-1 text-[11px] opacity-90">
                    <p className="font-semibold">Replying to {message.replyToSenderName || "message"}</p>
                    <p className="line-clamp-2 break-words">{message.replyToContentPreview || "Previous message"}</p>
                  </div>
                )}

                {message.deleted ? (
                  <div className="italic opacity-80">Message deleted</div>
                ) : (
                  <>
                    {message.content && <div className="whitespace-pre-wrap break-words">{message.content}</div>}
                    {message.attachmentUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          message.type === "image"
                            ? setPreviewImageUrl(message.attachmentUrl || null)
                            : window.open(message.attachmentUrl, "_blank", "noopener,noreferrer")
                        }
                        className="mt-2 inline-flex rounded-lg border border-current/30 px-2 py-1 text-xs underline-offset-2 hover:underline"
                      >
                        {message.type === "image" ? "Preview image" : message.attachmentName || "Open attachment"}
                      </button>
                    )}
                  </>
                )}

                {outgoing?.status === "sending" && (
                  <div className="mt-2 inline-flex items-center gap-1 text-[10px] opacity-80">
                    <Loader2 className="h-3 w-3 animate-spin" /> Sending...
                  </div>
                )}
                {outgoing?.status === "failed" && (
                  <div className="mt-2 inline-flex items-center gap-2 text-[10px] opacity-90">
                    Failed to send
                    <Button type="button" size="sm" variant="outline" className="h-6" onClick={() => handleRetryFailedMessage(outgoing)}>
                      Retry
                    </Button>
                  </div>
                )}

                {message.isPinned && !message.deleted && (
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-80">Pinned message</div>
                )}
                {message.deletedAt && (
                  <div className="mt-1 text-[10px] opacity-70">Deleted {formatTime(message.deletedAt)}</div>
                )}
                <div className="mt-1 text-[11px] opacity-75">{formatTime(message.createdAt)}</div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {showJumpToLatest && (
        <div className="pointer-events-none absolute bottom-28 right-4 z-20">
          <Button type="button" size="sm" className="pointer-events-auto" onClick={jumpToLatest}>
            Jump to latest
          </Button>
        </div>
      )}

      <div className="border-t border-border/70 bg-background/90 p-3 backdrop-blur-md sm:p-4">
        {replyTarget && (
          <div className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
            <div className="min-w-0">
              <p className="font-semibold">Replying to {replyTarget.senderName}</p>
              <p className="truncate text-muted-foreground">{replyTarget.contentPreview}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => setReplyTarget(null)}
            >
              Cancel
            </Button>
          </div>
        )}

        {attachmentDraft && (
          <div className="mb-2 rounded-xl border border-border/70 bg-card/60 p-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{attachmentDraft.file.name}</p>
                <p className="text-muted-foreground">
                  {attachmentDraft.isUploading
                    ? `Uploading... ${attachmentDraft.progress}%`
                    : attachmentDraft.error
                      ? attachmentDraft.error
                      : attachmentDraft.uploadedUrl
                        ? "Attachment ready"
                        : "Ready to upload"}
                </p>
                {attachmentDraft.previewUrl && (
                  <button
                    type="button"
                    className="mt-1 inline-flex rounded border border-border/70 px-2 py-0.5 text-[11px]"
                    onClick={() => setPreviewImageUrl(attachmentDraft.previewUrl || null)}
                  >
                    Preview image
                  </button>
                )}
              </div>
              <div className="inline-flex items-center gap-1">
                {attachmentDraft.error && (
                  <Button type="button" size="sm" variant="outline" className="h-7" onClick={retryAttachmentUpload}>
                    Retry
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    if (attachmentDraft.previewUrl) URL.revokeObjectURL(attachmentDraft.previewUrl);
                    setAttachmentDraft(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-10 rounded-xl"
            onClick={handleAttachClick}
            disabled={studentBlockedInSelectedGroup || studentBlockedByAdminOnly}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              studentBlockedInSelectedGroup
                ? "You are restricted from messaging in this chat"
                : studentBlockedByAdminOnly
                  ? "Only admins can send messages in this chat"
                  : replyTarget
                    ? `Reply to ${replyTarget.senderName}`
                    : "Write a message"
            }
            className="h-10 rounded-xl border-border/70"
            disabled={studentBlockedInSelectedGroup || studentBlockedByAdminOnly}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleSendMessage}
            disabled={isSendDisabled}
            className="h-10 min-w-10 rounded-xl px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleAttachmentSelected}
          />
        </div>
      </div>

      {showPinboard && (
        <div className="absolute inset-y-0 right-0 z-20 w-full border-l border-border/70 bg-background/95 p-4 backdrop-blur-md sm:w-[360px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pinned Messages</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPinboard(false)}>
              Close
            </Button>
          </div>

          <div className="space-y-2 overflow-y-auto pr-1 text-sm">
            {(pinnedData?.messages || []).map((message) => (
              <div key={message.id} className="rounded-xl border border-border/70 bg-card/70 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{message.senderName}</p>
                <p className="line-clamp-3 whitespace-pre-wrap break-words">{message.content || message.attachmentName || "Pinned attachment"}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{formatTime(message.pinnedAt || message.createdAt)}</p>
              </div>
            ))}

            {(pinnedData?.messages || []).length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                No pinned messages yet.
              </div>
            )}
          </div>
        </div>
      )}

      {showMembersPanel && canModerateSelectedGroup && (
        <div className="absolute inset-y-0 right-0 z-20 w-full border-l border-border/70 bg-background/95 p-4 backdrop-blur-md sm:w-[360px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Manage Members</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowMembersPanel(false)}>
              Close
            </Button>
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              value={membersSearch}
              onChange={(e) => setMembersSearch(e.target.value)}
              placeholder="Search members"
              className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0"
            />
          </div>

          <div className="mb-3 rounded-lg border border-border/70 bg-muted/30 p-2 text-xs text-muted-foreground">
            {membersData?.adminOnlyMessaging
              ? "Admin-only mode is ON. Students cannot send messages."
              : "Admin-only mode is OFF. Members can send messages."}
          </div>

          <ScrollArea className="h-[calc(100%-92px)]">
            <div className="space-y-2">
              {membersLoading && <div className="text-sm text-muted-foreground">Loading members...</div>}

              {!membersLoading && filteredMembers.map((member) => (
                <div key={member.userKey} className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.enrollmentNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={member.blocked ? "outline" : "destructive"}
                      className="h-8"
                      onClick={() =>
                        moderateMemberMutation.mutate({
                          groupId: selectedGroup.id,
                          enrollmentNumber: member.enrollmentNumber,
                          action: member.blocked ? "unblock" : "block",
                        })
                      }
                      disabled={moderateMemberMutation.isPending}
                    >
                      <Ban className="mr-1 h-3 w-3" />
                      {member.blocked ? "Unblock" : "Block"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() =>
                        moderateMemberMutation.mutate({
                          groupId: selectedGroup.id,
                          enrollmentNumber: member.enrollmentNumber,
                          action: "remove",
                        })
                      }
                      disabled={moderateMemberMutation.isPending}
                    >
                      <UserX className="mr-1 h-3 w-3" /> Remove
                    </Button>
                  </div>
                </div>
              ))}

              {!membersLoading && filteredMembers.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  {normalizedMembersSearch ? "No members match your search." : "No members found for this chat."}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  ) : (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-sm rounded-2xl border border-dashed border-border/70 bg-card/60 p-6 text-center">
        <p className="mb-1 text-sm font-semibold">Select a conversation</p>
        <p className="text-sm text-muted-foreground">Pick a club, event, or verified channel to begin chatting.</p>
      </div>
    </div>
  );

  const launcher = (
    <button
      type="button"
      onClick={async () => {
        const allowed = await verifyChatAccess();
        if (allowed) {
          setIsOpen(true);
          return;
        }

        toast({
          title: "Login required",
          description: "Please login to access chats.",
          variant: "destructive",
        });
      }}
      className={[
        "fixed bottom-5 right-5 z-40 h-14 w-14 rounded-2xl border border-primary/20",
        "bg-gradient-to-br from-primary/90 to-blue-500 text-primary-foreground shadow-2xl shadow-primary/30",
        "transition-all duration-300",
        isLoggedIn ? "hover:scale-105 hover:brightness-110" : "cursor-not-allowed opacity-70 grayscale",
        pulse ? "animate-pulse" : "",
      ].join(" ")}
      aria-label="Open chat"
      disabled={!isLoggedIn}
      data-testid="button-floating-chat"
    >
      <MessageCircle className="mx-auto h-6 w-6" />
      {isLoggedIn && unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-bold text-white ring-2 ring-background">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <>
      {isLoggedIn ? (
        launcher
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{launcher}</TooltipTrigger>
          <TooltipContent side="left">Login to access chats</TooltipContent>
        </Tooltip>
      )}

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full p-0 sm:max-w-[1080px]">
          <div className="flex h-full min-h-0 flex-col">
            <SheetHeader className="border-b border-border/70 bg-background/90 px-4 py-3 pr-12 backdrop-blur-md">
              <SheetTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" /> Club Chats
                </span>
                <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
                  {groups.length} {groups.length === 1 ? "channel" : "channels"}
                </span>
              </SheetTitle>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-hidden">
              {isMobile ? (
                <div className="flex h-full min-h-0 flex-col">
                  {activeMobilePane === "groups" && (
                    <div className="grid grid-cols-3 gap-2 border-b border-border/70 bg-background/90 p-2 backdrop-blur-md">
                      <Button
                        type="button"
                        size="sm"
                        variant={desktopTab === "chats" ? "default" : "outline"}
                        onClick={() => setDesktopTab("chats")}
                        className="h-8"
                      >
                        <Hash className="mr-1 h-3 w-3" /> Chats
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={desktopTab === "verified" ? "default" : "outline"}
                        onClick={() => setDesktopTab("verified")}
                        className="h-8"
                      >
                        <ShieldCheck className="mr-1 h-3 w-3" /> Clubs
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={desktopTab === "events" ? "default" : "outline"}
                        onClick={() => setDesktopTab("events")}
                        className="h-8"
                      >
                        <CalendarDays className="mr-1 h-3 w-3" /> Events
                      </Button>
                    </div>
                  )}
                  <div className="min-h-0 flex-1">
                    {activeMobilePane === "groups"
                      ? desktopTab === "events"
                        ? EventsSidebar
                        : desktopTab === "verified"
                          ? VerifiedSidebar
                          : GroupsSidebar
                      : ChatPane}
                  </div>
                </div>
              ) : (
                <div className="flex h-full bg-[linear-gradient(120deg,hsl(var(--background))_0%,hsl(var(--muted)/0.22)_100%)]">
                  <aside className="flex w-[78px] flex-col items-center gap-2 border-r border-border/70 bg-background/80 py-3 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setDesktopTab("chats")}
                      className={[
                        "inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 hover:-translate-y-0.5",
                        desktopTab === "chats"
                          ? "border-primary bg-primary text-primary-foreground shadow"
                          : "border-border/70 bg-background hover:border-primary/40 hover:bg-primary/5",
                      ].join(" ")}
                      title="Chats"
                    >
                      <Hash className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesktopTab("verified")}
                      className={[
                        "relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 hover:-translate-y-0.5",
                        desktopTab === "verified"
                          ? "border-primary bg-primary text-primary-foreground shadow"
                          : "border-border/70 bg-background hover:border-primary/40 hover:bg-primary/5",
                      ].join(" ")}
                      title="Verified clubs"
                    >
                      <ShieldCheck className="h-5 w-5" />
                      {myClubUnreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                          {myClubUnreadCount > 99 ? "99+" : myClubUnreadCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDesktopTab("events")}
                      className={[
                        "relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-200 hover:-translate-y-0.5",
                        desktopTab === "events"
                          ? "border-primary bg-primary text-primary-foreground shadow"
                          : "border-border/70 bg-background hover:border-primary/40 hover:bg-primary/5",
                      ].join(" ")}
                      title="Event chats"
                    >
                      <CalendarDays className="h-5 w-5" />
                      {myEventUnreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                          {myEventUnreadCount > 99 ? "99+" : myEventUnreadCount}
                        </span>
                      )}
                    </button>
                  </aside>
                  <div className="w-[360px] border-r border-border/70">
                    {desktopTab === "chats" ? GroupsSidebar : desktopTab === "events" ? EventsSidebar : VerifiedSidebar}
                  </div>
                  <div className="min-h-0 flex-1 bg-background/70">{ChatPane}</div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {previewImageUrl && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 z-10"
              onClick={() => setPreviewImageUrl(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <img src={previewImageUrl} alt="Attachment preview" className="max-h-[80vh] rounded-xl object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
