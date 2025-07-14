'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'viewing' | 'property' | 'sale' | 'client';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const generateNotifications = async (): Promise<Notification[]> => {
    if (!user) return [];

    try {
      const [viewings, properties, clients] = await Promise.all([
        api.get('/viewings/'),
        api.get('/properties/listings/'),
        api.get('/clients/')
      ]);

      const viewingsData = viewings.data.results || viewings.data;
      const propertiesData = properties.data.results || properties.data;
      const clientsData = clients.data.results || clients.data;

      const newNotifications: Notification[] = [];
      const now = new Date();

      // 1. Upcoming viewings (next 24 hours)
      viewingsData.forEach((viewing: any) => {
        const viewingDate = new Date(viewing.viewing_datetime);
        const timeDiff = viewingDate.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);

        if (viewing.status === 'SCHEDULED' && hoursDiff > 0 && hoursDiff <= 24) {
          newNotifications.push({
            id: `viewing-${viewing.id}`,
            type: 'viewing',
            title: 'Upcoming Viewing',
            message: `Viewing at ${viewing.property_address} with ${viewing.client_name} in ${Math.round(hoursDiff)} hours`,
            timestamp: viewing.viewing_datetime,
            read: false,
            priority: hoursDiff <= 2 ? 'high' : 'medium',
            actionUrl: '/dashboard/viewings'
          });
        }
      });

      // 2. New properties (added in last 24 hours)
      propertiesData.forEach((property: any) => {
        const createdDate = new Date(property.created_at);
        const timeDiff = now.getTime() - createdDate.getTime();
        const hoursDiff = timeDiff / (1000 * 3600);

        if (hoursDiff <= 24) {
          newNotifications.push({
            id: `property-new-${property.id}`,
            type: 'property',
            title: 'New Property Added',
            message: `${property.street_address} in ${property.town} has been listed`,
            timestamp: property.created_at,
            read: false,
            priority: 'medium',
            actionUrl: '/dashboard/properties'
          });
        }
      });

      // 3. Properties sold (status changed recently)
      propertiesData.forEach((property: any) => {
        if (property.status === 'SOLD' || property.status === 'CLOSED') {
          const updatedDate = new Date(property.updated_at || property.created_at);
          const timeDiff = now.getTime() - updatedDate.getTime();
          const hoursDiff = timeDiff / (1000 * 3600);

          if (hoursDiff <= 48) { // Show sold notifications for 2 days
            newNotifications.push({
              id: `property-sold-${property.id}`,
              type: 'sale',
              title: 'Property Sold! 🎉',
              message: `${property.street_address} has been sold for $${property.listing_price?.toLocaleString()}`,
              timestamp: property.updated_at || property.created_at,
              read: false,
              priority: 'high',
              actionUrl: '/dashboard/properties'
            });
          }
        }
      });

      // 4. Stale clients (not contacted in 3+ days)
      clientsData.forEach((client: any) => {
        if (client.last_contacted) {
          const lastContactDate = new Date(client.last_contacted);
          const timeDiff = now.getTime() - lastContactDate.getTime();
          const daysDiff = timeDiff / (1000 * 3600 * 24);

          if (daysDiff >= 3) {
            newNotifications.push({
              id: `client-stale-${client.id}`,
              type: 'client',
              title: 'Follow-up Needed',
              message: `${client.client_name} hasn't been contacted in ${Math.floor(daysDiff)} days`,
              timestamp: client.last_contacted,
              read: false,
              priority: daysDiff >= 7 ? 'high' : 'medium',
              actionUrl: '/dashboard/clients'
            });
          }
        }
      });

      // Sort by priority and timestamp
      return newNotifications.sort((a, b) => {
        // Priority order: high > medium > low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        // Then by timestamp (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    } catch (error) {
      console.error('Error generating notifications:', error);
      return [];
    }
  };

  const refreshNotifications = async () => {
    const newNotifications = await generateNotifications();
    
    // Preserve read status for existing notifications
    const existingReadIds = new Set(
      notifications.filter(n => n.read).map(n => n.id)
    );
    
    const updatedNotifications = newNotifications.map(notification => ({
      ...notification,
      read: existingReadIds.has(notification.id)
    }));
    
    setNotifications(updatedNotifications);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Refresh notifications every 5 minutes
  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      refreshNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
