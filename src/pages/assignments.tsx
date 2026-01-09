import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getAssignments, saveAssignments, type Assignment } from '@/utils/storage';
import { Plus, Edit, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(() => getAssignments());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(assignments.map(a => a.subject));
    return Array.from(uniqueSubjects).sort();
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (filterSubject !== 'all' && a.subject !== filterSubject) return false;
      if (filterPriority !== 'all' && a.priority !== filterPriority) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      try {
        const dateA = parseISO(a.dueDate);
        const dateB = parseISO(b.dueDate);
        const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
        return timeA - timeB;
      } catch {
        return 0;
      }
    });
  }, [assignments, filterSubject, filterPriority, filterStatus, searchQuery]);

  const handleSave = (data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => {
    let updated: Assignment[];
    if (editingAssignment) {
      updated = assignments.map(a =>
        a.id === editingAssignment.id
          ? { ...a, ...data, updatedAt: new Date().toISOString() }
          : a
      );
    } else {
      const newAssignment: Assignment = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [...assignments, newAssignment];
    }
    setAssignments(updated);
    saveAssignments(updated);
    setIsDialogOpen(false);
    setEditingAssignment(null);
  };

  const handleDelete = (id: string) => {
    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated);
    saveAssignments(updated);
  };

  const handleToggleStatus = (id: string) => {
    const updated = assignments.map(a => {
      if (a.id === id) {
        const newStatus = a.status === 'completed' ? 'pending' : 'completed';
        return { ...a, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return a;
    });
    setAssignments(updated);
    saveAssignments(updated);
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'completed') return false;
    try {
      const date = parseISO(dueDate);
      if (isNaN(date.getTime())) return false;
      return isPast(date) && !isToday(date);
    } catch {
      return false;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assignments</h2>
          <p className="text-muted-foreground">Manage your assignments and track deadlines</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingAssignment(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAssignment(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
              <DialogDescription>
                {editingAssignment ? 'Update assignment details' : 'Create a new assignment'}
              </DialogDescription>
            </DialogHeader>
            <AssignmentForm
              assignment={editingAssignment}
              onSubmit={handleSave}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingAssignment(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No assignments found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map(assignment => {
            const overdue = isOverdue(assignment.dueDate, assignment.status);
            return (
              <Card key={assignment.id} className={overdue ? 'border-destructive' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{assignment.title}</CardTitle>
                        {overdue && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        <Badge variant={getPriorityColor(assignment.priority)}>
                          {assignment.priority}
                        </Badge>
                        <Badge variant={assignment.status === 'completed' ? 'default' : 'outline'}>
                          {assignment.status}
                        </Badge>
                      </div>
                        <CardDescription>
                          <div className="flex items-center gap-4 mt-2">
                            <span>{assignment.subject}</span>
                            <span>•</span>
                            <span className={overdue ? 'text-destructive font-semibold' : ''}>
                              Due: {(() => {
                                try {
                                  const date = parseISO(assignment.dueDate);
                                  if (!isNaN(date.getTime())) {
                                    return format(date, 'MMM d, yyyy');
                                  }
                                } catch {}
                                return assignment.dueDate;
                              })()}
                            </span>
                          </div>
                        {assignment.description && (
                          <p className="mt-2">{assignment.description}</p>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(assignment.id)}
                      >
                        {assignment.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function AssignmentForm({
  assignment,
  onSubmit,
  onCancel,
}: {
  assignment: Assignment | null;
  onSubmit: (data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(assignment?.title || '');
  const [subject, setSubject] = useState(assignment?.subject || '');
  const [dueDate, setDueDate] = useState(() => {
    if (!assignment) return '';
    try {
      const date = parseISO(assignment.dueDate);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    } catch {}
    return assignment.dueDate;
  });
  const [priority, setPriority] = useState<Assignment['priority']>(assignment?.priority || 'medium');
  const [status, setStatus] = useState<Assignment['status']>(assignment?.status || 'pending');
  const [description, setDescription] = useState(assignment?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !dueDate) return;

    const dateStr = new Date(dueDate).toISOString().split('T')[0];
    onSubmit({
      title,
      subject,
      dueDate: dateStr,
      priority,
      status,
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Assignment title"
          required
        />
      </div>
      <div>
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject name"
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="dueDate">Due Date *</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="priority">Priority *</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Assignment['priority'])}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="status">Status *</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as Assignment['status'])}>
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details..."
          rows={4}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}

