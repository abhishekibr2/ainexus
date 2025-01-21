import { Bot } from "lucide-react";
import { motion } from "framer-motion";

export const EmptyState: React.FC = () => (
    <motion.div
        className="text-center py-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <motion.div
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
        >
            <Bot className="h-5 w-5 text-muted-foreground" />
        </motion.div>
        <motion.h3
            className="mt-4 text-lg font-semibold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
        >
            No agents found
        </motion.h3>
        <motion.p
            className="mt-2 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
        >
            We couldn't find any agents matching your criteria.
        </motion.p>
    </motion.div>
); 