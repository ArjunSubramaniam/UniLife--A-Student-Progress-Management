import { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAssignments, getAttendanceRecords, getExams } from '@/utils/storage';
import { FileText, Calendar, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Refresh data when navigating to dashboard or when localStorage changes
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [location.pathname]);
  
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Force refresh key dependency in useMemo
  const assignments = useMemo(() => getAssignments(), [refreshKey]);
  const attendance = useMemo(() => getAttendanceRecords(), [refreshKey]);
  const exams = useMemo(() => getExams(), [refreshKey]);

  const stats = useMemo(() => {
    const now = new Date();
    
    // Assignments
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.status === 'completed').length;
    const pendingAssignments = assignments.filter(a => a.status !== 'completed').length;
    const overdueAssignments = assignments.filter(a => {
      if (a.status === 'completed') return false;
      try {
        const date = new Date(a.dueDate);
        if (isNaN(date.getTime())) return false;
        return isPast(date) && !isToday(date);
      } catch {
        return false;
      }
    }).length;
    
    // Attendance
    const subjects = [...new Set(attendance.map(a => a.subject))];
    const attendanceBySubject = subjects.map(subject => {
      const records = attendance.filter(a => a.subject === subject);
      const present = records.filter(a => a.status === 'present').length;
      const total = records.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { subject, present, total, percentage };
    });
    
    // Exams
    const upcomingExams = exams.filter(e => {
      try {
        const examDate = new Date(`${e.date}T${e.time}`);
        if (isNaN(examDate.getTime())) return false;
        return examDate >= now;
      } catch {
        return false;
      }
    }).sort((a, b) => {
      try {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
        const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
        return timeA - timeB;
      } catch {
        return 0;
      }
    }).slice(0, 5);
    
    // Recent activity
    const allActivities = [
      ...assignments.map(a => {
        try {
          return {
            type: 'assignment' as const,
            title: a.title,
            date: new Date(a.createdAt),
            action: 'created' as const,
          };
        } catch {
          return null;
        }
      }).filter((a): a is NonNullable<typeof a> => a !== null),
      ...assignments.filter(a => a.status === 'completed').map(a => {
        try {
          return {
            type: 'assignment' as const,
            title: a.title,
            date: new Date(a.updatedAt),
            action: 'completed' as const,
          };
        } catch {
          return null;
        }
      }).filter((a): a is NonNullable<typeof a> => a !== null),
      ...exams.map(e => {
        try {
          return {
            type: 'exam' as const,
            title: e.title,
            date: new Date(e.createdAt),
            action: 'created' as const,
          };
        } catch {
          return null;
        }
      }).filter((a): a is NonNullable<typeof a> => a !== null),
    ].sort((a, b) => {
      const timeA = isNaN(a.date.getTime()) ? 0 : a.date.getTime();
      const timeB = isNaN(b.date.getTime()) ? 0 : b.date.getTime();
      return timeB - timeA;
    }).slice(0, 5);
    
    // Priority distribution
    const priorityData = [
      { name: 'High', value: assignments.filter(a => a.priority === 'high').length },
      { name: 'Medium', value: assignments.filter(a => a.priority === 'medium').length },
      { name: 'Low', value: assignments.filter(a => a.priority === 'low').length },
    ];
    
    // Status distribution
    const statusData = [
      { name: 'Completed', value: assignments.filter(a => a.status === 'completed').length },
      { name: 'In Progress', value: assignments.filter(a => a.status === 'in-progress').length },
      { name: 'Pending', value: assignments.filter(a => a.status === 'pending').length },
    ];

    return {
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      overdueAssignments,
      attendanceBySubject,
      upcomingExams,
      recentActivity: allActivities,
      priorityData,
      statusData,
    };
  }, [assignments, attendance, exams]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your academic progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedAssignments} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueAssignments} overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingExams.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingExams.length > 0 ? (() => {
                try {
                  const examDate = new Date(`${stats.upcomingExams[0].date}T${stats.upcomingExams[0].time}`);
                  if (!isNaN(examDate.getTime())) {
                    return `Next ${format(examDate, 'MMM d')}`;
                  }
                } catch {}
                return 'No upcoming';
              })() : 'No upcoming'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Tracked</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceBySubject.length}</div>
            <p className="text-xs text-muted-foreground">
              Attendance records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Assignments by priority</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Overview */}
      {stats.attendanceBySubject.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Percentage by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.attendanceBySubject.map((item) => (
                <div key={item.subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.subject}</span>
                    <span className={`text-sm font-semibold ${item.percentage < 75 ? 'text-destructive' : 'text-primary'}`}>
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        item.percentage < 75 ? 'bg-destructive' : 'bg-primary'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  {item.percentage < 75 && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span>Below 75% threshold</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Exams */}
      {stats.upcomingExams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>Next scheduled examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingExams.map((exam) => {
                try {
                  const examDate = new Date(`${exam.date}T${exam.time}`);
                  if (isNaN(examDate.getTime())) return null;
                  const daysUntil = Math.max(0, differenceInDays(examDate, new Date()));
                  return (
                    <div key={exam.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{exam.title}</h4>
                        <p className="text-sm text-muted-foreground">{exam.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(examDate, 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{daysUntil}</div>
                        <div className="text-sm text-muted-foreground">days</div>
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates across all modules</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`rounded-full p-2 ${
                    activity.type === 'assignment' ? 'bg-primary/10' : 'bg-secondary'
                  }`}>
                    {activity.type === 'assignment' ? (
                      <FileText className="h-4 w-4 text-primary" />
                    ) : (
                      <BookOpen className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.action === 'created' ? 'Created' : 'Completed'} • {format(activity.date, 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity</p>
              <Link to="/assignments">
                <Button variant="outline" className="mt-4">Create Your First Assignment</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

