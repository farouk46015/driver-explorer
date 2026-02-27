import { memo, useState } from 'react';
import { Edit, X } from 'lucide-react';

interface UpdateDialogProps {
  isOpen: boolean;
  title: string;
  currentValue: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (newValue: string) => void;
  onCancel: () => void;
}

function UpdateDialog({
  isOpen,
  title,
  currentValue,
  placeholder = 'Enter new name',
  confirmText = 'Update',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: UpdateDialogProps) {
  const [inputValue, setInputValue] = useState(currentValue);
  const [prevCurrentValue, setPrevCurrentValue] = useState(currentValue);

  // Update inputValue when currentValue changes (different file/folder selected)
  if (currentValue !== prevCurrentValue) {
    setInputValue(currentValue);
    setPrevCurrentValue(currentValue);
  }

  if (!isOpen) {
    return null;
  }

  const handleCancel = () => {
    setInputValue(currentValue);
    onCancel();
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim() && inputValue !== currentValue) {
      onConfirm(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transform transition-all">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon and Title */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0 text-blue-600">
            <Edit className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="ml-10 mb-6">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={!inputValue.trim() || inputValue === currentValue}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(UpdateDialog);
