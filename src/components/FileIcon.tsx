import {
  Folder,
  FileText,
  Image,
  FileSpreadsheet,
  FileVideo,
  Music,
  Archive,
  File,
} from 'lucide-react';

interface FileIconProps {
  type: 'file' | 'folder';
  extension?: string | null;
  size?: 'large' | 'small';
}

export default function FileIcon({ type, extension, size = 'small' }: FileIconProps) {
  const iconSize = size === 'large' ? 'w-12 h-12' : 'w-5 h-5';

  if (type === 'folder') {
    return <Folder className={`${iconSize} text-blue-500`} />;
  }

  const getIconColor = (ext?: string | null): string => {
    if (!ext) {
      return 'text-gray-500';
    }

    const extension = ext.toLowerCase();

    if (['pdf'].includes(extension)) {
      return 'text-red-500';
    }
    if (['doc', 'docx'].includes(extension)) {
      return 'text-blue-600';
    }
    if (['txt'].includes(extension)) {
      return 'text-gray-600';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return 'text-green-500';
    }
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return 'text-green-600';
    }
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return 'text-purple-500';
    }
    if (['mp3', 'wav', 'flac', 'aac'].includes(extension)) {
      return 'text-orange-500';
    }
    if (['zip', 'rar', '7z', 'tar'].includes(extension)) {
      return 'text-yellow-600';
    }

    return 'text-gray-500';
  };

  const iconColor = getIconColor(extension);
  const className = `${iconSize} ${iconColor}`;

  if (!extension) {
    return <File className={className} />;
  }

  const ext = extension.toLowerCase();

  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
    return <FileText className={className} />;
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) {
    return <Image className={className} />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className={className} />;
  }
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
    return <FileVideo className={className} />;
  }
  if (['mp3', 'wav', 'flac', 'aac'].includes(ext)) {
    return <Music className={className} />;
  }
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) {
    return <Archive className={className} />;
  }

  return <File className={className} />;
}
