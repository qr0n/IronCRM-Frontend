import { useAuth } from '@/contexts/AuthContext';
import { TrashIcon } from '@heroicons/react/24/outline';

interface RoleBasedDeleteButtonProps {
  onDelete: () => void;
  allowedRoles: string[];
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RoleBasedDeleteButton({ 
  onDelete, 
  allowedRoles, 
  title = "Delete",
  size = 'sm'
}: RoleBasedDeleteButtonProps) {
  const { user } = useAuth();
  
  // Don't render the button if user doesn't have permission
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  };

  return (
    <button
      onClick={onDelete}
      className="text-red-600 hover:text-red-800"
      title={title}
    >
      <TrashIcon className={sizeClasses[size]} />
    </button>
  );
}
