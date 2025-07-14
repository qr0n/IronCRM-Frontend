'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Note {
  id: number;
  title: string;
  content: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  is_important: boolean;
  is_private: boolean;
}

interface NotesComponentProps {
  objectType: 'property' | 'client' | 'viewing';
  objectId: number;
  modelName: string;
  appLabel: string;
}

export default function NotesComponent({ objectType, objectId, modelName, appLabel }: NotesComponentProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    is_important: false,
    is_private: false,
  });

  useEffect(() => {
    fetchNotes();
  }, [objectId]);

  const fetchNotes = async () => {
    try {
      // First get content type ID
      const contentTypesResponse = await api.get('/core/api/notes/content_types/');
      const contentType = contentTypesResponse.data.find(
        (ct: any) => ct.app_label === appLabel && ct.model === modelName
      );
      
      if (contentType) {
        const response = await api.get(
          `/core/api/notes/for_object/?content_type_id=${contentType.id}&object_id=${objectId}`
        );
        setNotes(response.data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.content.trim()) return;

    try {
      await api.post('/core/api/notes/', {
        ...newNote,
        object_id: objectId,
        model_name: modelName,
        app_label: appLabel,
      });
      
      setNewNote({ title: '', content: '', is_important: false, is_private: false });
      setShowAddForm(false);
      fetchNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await api.delete(`/core/api/notes/${noteId}/`);
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Notes ({notes.length})
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary text-sm transition-all hover:scale-105"
        >
          {showAddForm ? 'Cancel' : '+ Add Note'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddNote} className="bg-gray-50 p-4 rounded-lg space-y-3 animate-slideIn">
          <div>
            <input
              type="text"
              placeholder="Note title (optional)"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
          <div>
            <textarea
              placeholder="Add your note here..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              required
            />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newNote.is_important}
                onChange={(e) => setNewNote({ ...newNote, is_important: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Important</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newNote.is_private}
                onChange={(e) => setNewNote({ ...newNote, is_private: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Private</span>
            </label>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-secondary text-sm transition-all hover:scale-105"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm transition-all hover:scale-105"
            >
              Add Note
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notes yet. Add the first note to keep track of important information.
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                note.is_important
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {note.title && (
                    <h4 className="font-medium text-gray-900 mb-1">{note.title}</h4>
                  )}
                  <p className="text-gray-700 mb-2">{note.content}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-3">
                    <span>by {note.created_by_name}</span>
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    {note.is_important && (
                      <span className="text-yellow-600 font-medium">⭐ Important</span>
                    )}
                    {note.is_private && (
                      <span className="text-blue-600 font-medium">🔒 Private</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-red-500 hover:text-red-700 text-sm ml-4 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
