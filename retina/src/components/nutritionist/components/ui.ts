// @ts-nocheck
/**
 * Barrel re-export of design-system primitives used by the nutritionist screens.
 *
 * The artifact was authored against shadcn-style imports like
 *   `import { Button } from "@/components/ui/button"`
 * but this repo bundles everything through `_designSystem/.../library.js`.
 * This barrel translates those shadcn-style imports into the actual DS bundle.
 */
export {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  AlertTitle,
  Checkbox,
  Textarea,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9/library.js";
