export type Assignment = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceRecord = {
  id: string;
  subject: string;
  date: string;
  status: 'present' | 'absent';
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEYS = {
  ASSIGNMENTS: 'unilife_assignments',
  ATTENDANCE: 'unilife_attendance',
  EXAMS: 'unilife_exams',
  NOTES: 'unilife_notes',
  THEME: 'unilife_theme',
} as const;

// Safe LocalStorage operations
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
}

function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
    return false;
  }
}

// Assignments
export function getAssignments(): Assignment[] {
  const data = safeGetItem(STORAGE_KEYS.ASSIGNMENTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveAssignments(assignments: Assignment[]): boolean {
  return safeSetItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
}

// Attendance
export function getAttendanceRecords(): AttendanceRecord[] {
  const data = safeGetItem(STORAGE_KEYS.ATTENDANCE);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveAttendanceRecords(records: AttendanceRecord[]): boolean {
  return safeSetItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
}

// Exams
export function getExams(): Exam[] {
  const data = safeGetItem(STORAGE_KEYS.EXAMS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveExams(exams: Exam[]): boolean {
  return safeSetItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
}

// Notes
export function getNotes(): Note[] {
  const data = safeGetItem(STORAGE_KEYS.NOTES);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveNotes(notes: Note[]): boolean {
  return safeSetItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
}

// Theme
export function getTheme(): 'light' | 'dark' {
  const theme = safeGetItem(STORAGE_KEYS.THEME);
  return (theme === 'dark' || theme === 'light') ? theme : 'light';
}

export function saveTheme(theme: 'light' | 'dark'): boolean {
  return safeSetItem(STORAGE_KEYS.THEME, theme);
}

// Reset all data
export function resetAllData(): boolean {
  let success = true;
  success = safeRemoveItem(STORAGE_KEYS.ASSIGNMENTS) && success;
  success = safeRemoveItem(STORAGE_KEYS.ATTENDANCE) && success;
  success = safeRemoveItem(STORAGE_KEYS.EXAMS) && success;
  success = safeRemoveItem(STORAGE_KEYS.NOTES) && success;
  // Keep theme preference
  return success;
}

