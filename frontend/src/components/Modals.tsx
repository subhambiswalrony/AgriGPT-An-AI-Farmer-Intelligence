import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { LogOut, AlertCircle } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface DeleteAccountModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const LogoutConfirmModal: React.FC<LogoutModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed top-0 left-0 w-screen h-screen bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onCancel}
      >
        {/* Modal */}
        <motion.div
          className="backdrop-blur-2xl bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl border-2 border-red-200/50 dark:border-red-700/50 p-6 sm:p-8 w-full max-w-sm transition-all duration-300"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-red-100/90 to-red-200/90 dark:from-red-900/40 dark:to-red-800/40 border-2 border-red-300/50 dark:border-red-600/50 flex items-center justify-center shadow-lg">
              <LogOut size={32} className="sm:w-10 sm:h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-3">
            Logout Confirmation
          </h3>
          
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6 sm:mb-8">
            Are you sure you want to logout?
          </p>
          
          <div className="flex space-x-3">
            <motion.button
              onClick={onCancel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 rounded-xl backdrop-blur-xl bg-gradient-to-br from-gray-100/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-700/90 border-2 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-200 font-semibold hover:shadow-lg transition-all duration-200"
            >
              No, Cancel
            </motion.button>
            
            <motion.button
              onClick={onConfirm}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 dark:from-red-600 dark:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Yes, Logout
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>,
    document.body
  );
};

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="backdrop-blur-xl bg-white/95 dark:bg-gray-800/95 rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-red-200/50 dark:border-red-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
            className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 rounded-2xl shadow-lg"
          >
            <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
          </motion.div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
            Confirm Deletion
          </h3>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          Are you absolutely sure you want to delete your account? This action{' '}
          <span className="font-bold text-red-600 dark:text-red-400">cannot be undone</span> and all
          your data will be permanently removed from our servers.
        </p>

        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 backdrop-blur-xl bg-gray-200/80 dark:bg-gray-700/80 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 border-2 border-gray-300/50 dark:border-gray-600/50"
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            disabled={isLoading}
            className="relative overflow-hidden flex-1 px-4 py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 group"
          >
            <motion.div
              animate={{
                x: ["-100%", "200%"]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />
            <span className="relative z-10">{isLoading ? 'Deleting...' : 'Yes, Delete'}</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
