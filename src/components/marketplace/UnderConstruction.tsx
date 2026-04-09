import { motion } from "framer-motion";
import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import craneImg from "@/assets/construction-crane.png";
import AppLayout from "@/components/layout/AppLayout";

const UnderConstruction = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center overflow-hidden">
        {/* Crane animation */}
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 40, damping: 12, duration: 1.5 }}
          className="relative w-48 h-48 sm:w-64 sm:h-64 mb-4"
        >
          {/* Swinging hook effect */}
          <motion.img
            src={craneImg}
            alt="Under construction crane"
            className="w-full h-full object-contain drop-shadow-lg"
            animate={{ rotate: [0, 1.5, -1.5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Hard hat icon bouncing */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          className="mb-4"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Construction className="h-10 w-10 text-yellow-500" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2"
        >
          Marketplace Coming Soon!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-muted-foreground font-display text-sm sm:text-base max-w-md mb-2"
        >
          We're building something amazing for you. The marketplace is currently under construction.
        </motion.p>

        {/* Progress bar animation */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="w-full max-w-xs mb-6"
        >
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "45%" }}
              transition={{ delay: 1.3, duration: 1.5, ease: "easeOut" }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="text-xs text-muted-foreground mt-1 font-display"
          >
            45% complete
          </motion.p>
        </motion.div>

        {/* Animated bricks */}
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + i * 0.15, type: "spring", stiffness: 300 }}
              className="w-8 h-5 rounded-sm bg-gradient-to-b from-yellow-600 to-yellow-700 border border-yellow-800/30"
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="rounded-xl font-display gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default UnderConstruction;
