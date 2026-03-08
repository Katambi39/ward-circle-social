import { Eye, EyeOff, Shield } from "lucide-react";
import { useAnonymous } from "@/contexts/AnonymousContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const IdentityToggle = () => {
  const { isAnonymous, toggleAnonymous, anonAlias } = useAnonymous();

  return (
    <button
      onClick={toggleAnonymous}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-all border",
        isAnonymous
          ? "bg-foreground text-background border-foreground shadow-md"
          : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
      )}
    >
      <AnimatePresence mode="wait">
        {isAnonymous ? (
          <motion.span
            key="anon"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>{anonAlias}</span>
            <span className="text-[10px] opacity-70">· Anon</span>
          </motion.span>
        ) : (
          <motion.span
            key="public"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Public</span>
            <Shield className="h-3 w-3 text-primary" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default IdentityToggle;
