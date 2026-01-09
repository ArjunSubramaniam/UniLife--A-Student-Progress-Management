import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { getExams, saveExams, type Exam } from '@/utils/storage';
import { Plus, Edit, Trash2, Clock, MapPin } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes, isPast } from 'date-fns';

export default function Exams() {
  const [exams, setExams] = useState<Exam[]>(() => {
    const allExams = getExams();
    const now = new Date();
    return allExams.filter(exam => {
      try {
        const examDateTime = new Date(`${exam.date}T${exam.time}`);
        if (isNaN(examDateTime.getTime())) return false;
        return examDateTime >= now;
      } catch {
        return false;
      }
    });
  });

  useEffect(() => {
    // Auto-archive past exams on mount
    const allExams = getExams();
    const now = new Date();
    const upcomingExams = allExams.filter(exam => {
      try {
        const examDateTime = new Date(`${exam.date}T${exam.time}`);
        if (isNaN(examDateTime.getTime())) return false;
        return examDateTime >= now;
      } catch {
        return false;
      }
    });
    
    setExams(upcomingExams);
    saveExams(upcomingExams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      try {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
        return timeA - timeB;
      } catch {
        return 0;
      }
    });
  }, [exams]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const handleSave = (data: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>) => {
    let updated: Exam[];
    if (editingExam) {
      updated = exams.map(e =>
        e.id === editingExam.id
          ? { ...e, ...data, updatedAt: new Date().toISOString() }
          : e
      );
    } else {
      const newExam: Exam = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updated = [...exams, newExam];
    }
    
    // Filter out past exams and invalid dates
    const now = new Date();
    const upcomingOnly = updated.filter(exam => {
      try {
        const examDateTime = new Date(`${exam.date}T${exam.time}`);
        if (isNaN(examDateTime.getTime())) return false;
        return examDateTime >= now;
      } catch {
        return false;
      }
    });
    
    setExams(upcomingOnly);
    saveExams(upcomingOnly);
    setIsDialogOpen(false);
    setEditingExam(null);
  };

  const handleDelete = (id: string) => {
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    saveExams(updated);
  };

  const getCountdown = (date: string, time: string) => {
    try {
      const examDateTime = new Date(`${date}T${time}`);
      const now = new Date();
      
      if (isNaN(examDateTime.getTime()) || isPast(examDateTime)) {
        return { days: 0, hours: 0, minutes: 0, isPast: true };
      }
      
      const days = Math.max(0, differenceInDays(examDateTime, now));
      const hours = Math.max(0, differenceInHours(examDateTime, now) % 24);
      const minutes = Math.max(0, differenceInMinutes(examDateTime, now) % 60);
      
      return { days, hours, minutes, isPast: false };
    } catch {
      return { days: 0, hours: 0, minutes: 0, isPast: true };
    }
  };

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(exams.map(e => e.subject));
    return Array.from(uniqueSubjects).sort();
  }, [exams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Exams</h2>
          <p className="text-muted-foreground">Manage your upcoming examinations</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingExam(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingExam(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExam ? 'Edit Exam' : 'New Exam'}</DialogTitle>
              <DialogDescription>
                {editingExam ? 'Update exam details' : 'Create a new exam schedule'}
              </DialogDescription>
            </DialogHeader>
            <ExamForm
              exam={editingExam}
              subjects={subjects}
              onSubmit={handleSave}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingExam(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        {sortedExams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No upcoming exams</p>
              <p className="text-sm text-muted-foreground mb-4">
                Past exams are automatically archived
              </p>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Schedule Exam
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedExams.map(exam => {
            const countdown = getCountdown(exam.date, exam.time);
            let examDateTime: Date | null = null;
            try {
              const dt = new Date(`${exam.date}T${exam.time}`);
              if (!isNaN(dt.getTime())) {
                examDateTime = dt;
              }
            } catch {}
            const isUpcoming = countdown.days <= 7 && !countdown.isPast;
            
            return (
              <Card key={exam.id} className={isUpcoming ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{exam.title}</CardTitle>
                        <Badge variant="default">{exam.subject}</Badge>
                        {isUpcoming && (
                          <Badge variant="secondary">Upcoming</Badge>
                        )}
                      </div>
                      <CardDescription>
                        <div className="space-y-1 mt-2">
                          {examDateTime ? (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{format(examDateTime, 'EEEE, MMMM d, yyyy')} at {format(examDateTime, 'h:mm a')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{exam.date} at {exam.time}</span>
                            </div>
                          )}
                          {exam.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{exam.location}</span>
                            </div>
                          )}
                          {exam.notes && (
                            <p className="mt-2">{exam.notes}</p>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingExam(exam);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(exam.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {!countdown.isPast && (
                  <CardContent>
                    <div className="flex items-center gap-6 p-4 bg-muted rounded-lg">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{countdown.days}</div>
                        <div className="text-sm text-muted-foreground">Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{countdown.hours}</div>
                        <div className="text-sm text-muted-foreground">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">{countdown.minutes}</div>
                        <div className="text-sm text-muted-foreground">Minutes</div>
                      </div>
                      <div className="ml-auto text-sm text-muted-foreground">
                        Remaining until exam
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function ExamForm({
  exam,
  subjects,
  onSubmit,
  onCancel,
}: {
  exam: Exam | null;
  subjects: string[];
  onSubmit: (data: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(exam?.title || '');
  const [subject, setSubject] = useState(exam?.subject || '');
  const [date, setDate] = useState(
    exam ? exam.date : ''
  );
  const [time, setTime] = useState(exam?.time || '');
  const [location, setLocation] = useState(exam?.location || '');
  const [notes, setNotes] = useState(exam?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !date || !time) return;

    onSubmit({
      title,
      subject,
      date,
      time,
      location: location || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Exam Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Final Exam"
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
          list="subject-suggestions"
        />
        {subjects.length > 0 && (
          <datalist id="subject-suggestions">
            {subjects.map(sub => (
              <option key={sub} value={sub} />
            ))}
          </datalist>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Room 101, Building A"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes or reminders..."
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

