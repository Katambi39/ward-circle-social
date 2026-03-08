import { useState } from "react";
import { Camera, Type } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PhotoStoryCreator from "./PhotoStoryCreator";
import TextStoryCreator from "./TextStoryCreator";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type StoryMode = "choose" | "photo" | "text";

const CreateStoryDialog = ({ open, onOpenChange, onCreated }: CreateStoryDialogProps) => {
  const [mode, setMode] = useState<StoryMode>("choose");

  const reset = () => setMode("choose");

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleCreated = () => {
    onCreated();
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === "choose" ? "Create Story" : mode === "photo" ? "Photo Story" : "Text Story"}
          </DialogTitle>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid grid-cols-2 gap-3 py-4">
            <button
              onClick={() => setMode("photo")}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-display font-semibold text-foreground">Photo</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Photo or video story</p>
              </div>
            </button>

            <button
              onClick={() => setMode("text")}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-secondary hover:bg-secondary/5 transition-all"
            >
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Type className="h-8 w-8 text-secondary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-display font-semibold text-foreground">Text</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Colorful text story</p>
              </div>
            </button>
          </div>
        )}

        {mode === "photo" && (
          <PhotoStoryCreator onBack={reset} onCreated={handleCreated} onClose={handleClose} />
        )}

        {mode === "text" && (
          <TextStoryCreator onBack={reset} onCreated={handleCreated} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;
