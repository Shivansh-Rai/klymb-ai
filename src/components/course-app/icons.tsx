import {
  ArrowDown, ArrowRight, ArrowUp, AudioLines, Award, Bell, Captions, ChartColumn, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  CircleAlert, Clock, Copy, Database, Download, FileText, Flame, Gauge, Headphones, House, Keyboard, Layers, Lock, Maximize, Minimize, Minus, MessageSquare, Pause, Play, Plus,
  RotateCcw, RotateCw, Settings, Shield, Target, Trash, TrendingUp, User, Volume2, VolumeX, WifiOff, X, Zap, type LucideIcon,
} from "lucide-react";

const ICONS = {
  home: House, layers: Layers, chart: ChartColumn, play: Play, pause: Pause, flame: Flame, check: Check, lock: Lock,
  chevL: ChevronLeft, chevR: ChevronRight, chevD: ChevronDown, chevU: ChevronUp, clock: Clock, award: Award, note: FileText,
  up: ArrowUp, down: ArrowDown, rotL: RotateCcw, rotR: RotateCw, plus: Plus, x: X, arrowR: ArrowRight, target: Target,
  trending: TrendingUp, zap: Zap, msg: MessageSquare, bell: Bell, user: User, download: Download, trash: Trash,
  copy: Copy, wifiOff: WifiOff, alert: CircleAlert, db: Database, shield: Shield, headphones: Headphones, settings: Settings, volume: Volume2, mute: VolumeX, fullscreen: Maximize,
  exitFullscreen: Minimize, captions: Captions, audio: AudioLines, keyboard: Keyboard, gauge: Gauge, minus: Minus,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** Lucide, drawn the Modernist way: square caps, mitred joins. Play and pause are filled. */
export function Icon({ name, size = 20, stroke = 2, className }: { name: IconName; size?: number; stroke?: number; className?: string }) {
  const C = ICONS[name];
  const filled = name === "play" || name === "pause";
  return (
    <C
      aria-hidden="true"
      width={size}
      height={size}
      strokeWidth={stroke}
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill={filled ? "currentColor" : "none"}
      className={className ?? "block flex-none"}
    />
  );
}
