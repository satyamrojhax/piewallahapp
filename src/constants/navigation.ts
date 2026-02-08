import type { LucideIcon } from "lucide-react";
import { Home, Radio, FileText, MessageSquare, Bot, Gamepad2, User, Book, Package } from "lucide-react";
import { BatchesIcon, StudyIcon } from "@/components/icons/CustomIcons";

export type PrimaryNavLink = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type SidebarNavLink = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showInBottomNav?: boolean;
};

// Bottom navigation - essential items
export const bottomNavLinks: PrimaryNavLink[] = [
  { path: "/", label: "Study", icon: Book },
  { path: "/batches", label: "Batches", icon: BatchesIcon },
  { path: "/community", label: "Community", icon: MessageSquare },
  { path: "/my-batches", label: "My Batches", icon: Package },
  { path: "/profile", label: "Profile", icon: User },
];

// Sidebar navigation - all items
export const sidebarNavLinks: SidebarNavLink[] = [
  { path: "/", label: "Home", icon: Home, showInBottomNav: true },
  { path: "/batches", label: "Batches", icon: BatchesIcon, showInBottomNav: false },
  { path: "/study", label: "Study", icon: StudyIcon, showInBottomNav: true },
  { path: "/pdf-bank", label: "PDF Bank", icon: FileText, showInBottomNav: false },
  { path: "/community", label: "Community", icon: MessageSquare, showInBottomNav: false },
  { path: "/ai-guru", label: "AI Guru", icon: Bot, showInBottomNav: false },
  { path: "/my-batches", label: "My Batches", icon: Book, showInBottomNav: true },
  { path: "/tictactoe", label: "Tic-Tac-Toe", icon: Gamepad2, showInBottomNav: false },
  { path: "/profile", label: "Profile", icon: User, showInBottomNav: true },
];

// Legacy compatibility
export const primaryNavLinks = sidebarNavLinks;
