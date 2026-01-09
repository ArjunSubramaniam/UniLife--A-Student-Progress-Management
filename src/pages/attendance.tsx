import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAttendanceRecords, saveAttendanceRecords, type AttendanceRecord } from '@/utils/storage';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Attendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>(() => getAttendanceRecords());
  const [newSubject, setNewSubject] = useState('');

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(records.map(r => r.subject));
    return Array.from(uniqueSubjects).sort();
  }, [records]);

  const attendanceStats = useMemo(() => {
    return subjects.map(subject => {
      const subjectRecords = records.filter(r => r.subject === subject);
      const present = subjectRecords.filter(r => r.status === 'present').length;
      const absent = subjectRecords.filter(r => r.status === 'absent').length;
      const total = subjectRecords.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return {
        subject,
        present,
        absent,
        total,
        percentage,
      };
    });
  }, [subjects, records]);


  const handleMarkAttendance = (subject: string, status: 'present' | 'absent') => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const existingRecord = records.find(
      r => r.subject === subject && r.date === today
    );

    let updated: AttendanceRecord[];
    if (existingRecord) {
      updated = records.map(r =>
        r.id === existingRecord.id
          ? { ...r, status }
          : r
      );
    } else {
      const newRecord: AttendanceRecord = {
        id: crypto.randomUUID(),
        subject,
        date: today,
        status,
      };
      updated = [...records, newRecord];
    }

    setRecords(updated);
    saveAttendanceRecords(updated);
  };

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
        <p className="text-muted-foreground">Track your attendance by subject</p>
      </div>

      {/* Quick Mark Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Mark Attendance</CardTitle>
          <CardDescription>Mark attendance for any subject (subjects are created automatically)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter subject name"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newSubject.trim()) {
                  handleMarkAttendance(newSubject.trim(), 'present');
                  setNewSubject('');
                }
              }}
            />
            <Button
              onClick={() => {
                if (newSubject.trim()) {
                  handleMarkAttendance(newSubject.trim(), 'present');
                  setNewSubject('');
                }
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Present
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (newSubject.trim()) {
                  handleMarkAttendance(newSubject.trim(), 'absent');
                  setNewSubject('');
                }
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Mark Absent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Overview */}
      {attendanceStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Percentage by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {attendanceStats.map((stat) => {
                const todayRecord = records.find(
                  r => r.subject === stat.subject && r.date === today
                );
                const isLowAttendance = stat.percentage < 75;
                
                return (
                  <div key={stat.subject} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{stat.subject}</h3>
                        <p className="text-sm text-muted-foreground">
                          {stat.present} present, {stat.absent} absent • Total: {stat.total} classes
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isLowAttendance ? 'text-destructive' : 'text-primary'}`}>
                          {stat.percentage}%
                        </div>
                        {isLowAttendance && (
                          <Badge variant="destructive" className="mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Below 75%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isLowAttendance ? 'bg-destructive' : 'bg-primary'
                        }`}
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>

                    {/* Today's Attendance */}
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <span className="text-sm font-medium">Today's Attendance:</span>
                      <div className="flex gap-2">
                        <Button
                          variant={todayRecord?.status === 'present' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleMarkAttendance(stat.subject, 'present')}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Present
                        </Button>
                        <Button
                          variant={todayRecord?.status === 'absent' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleMarkAttendance(stat.subject, 'absent')}
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Absent
                        </Button>
                      </div>
                      {todayRecord && (
                        <Badge variant={todayRecord.status === 'present' ? 'default' : 'destructive'}>
                          Marked as {todayRecord.status}
                        </Badge>
                      )}
                    </div>

                    {/* Recent Records */}
                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-medium text-muted-foreground">Recent Records:</p>
                      <div className="flex flex-wrap gap-2">
                        {records
                          .filter(r => r.subject === stat.subject)
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .slice(0, 10)
                          .map(record => (
                            <Badge
                              key={record.id}
                              variant={record.status === 'present' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {format(new Date(record.date), 'MMM d')}: {record.status}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {subjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No subjects added yet</p>
            <p className="text-sm text-muted-foreground">Add a subject above to start tracking attendance</p>
          </CardContent>
        </Card>
      )}

      {/* Warning Section */}
      {attendanceStats.some(stat => stat.percentage < 75) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Low Attendance Warning
            </CardTitle>
            <CardDescription>
              The following subjects have attendance below 75%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attendanceStats
                .filter(stat => stat.percentage < 75)
                .map(stat => (
                  <div key={stat.subject} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <span className="font-medium">{stat.subject}</span>
                    <Badge variant="destructive">{stat.percentage}%</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

