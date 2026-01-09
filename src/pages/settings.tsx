import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTheme } from '@/hooks/use-theme';
import { resetAllData } from '@/utils/storage';
import { AlertTriangle, Moon, Sun } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleReset = () => {
    resetAllData();
    setIsResetDialogOpen(false);
    // Reload page to reset all state
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your preferences and data</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize the appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme" className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                Dark Mode
              </Label>
              <CardDescription>
                Switch between light and dark theme
              </CardDescription>
            </div>
            <Switch
              id="theme"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Your theme preference is saved automatically and will persist across sessions.
          </p>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Manage your stored data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-destructive">Reset All Data</h4>
                <p className="text-sm text-muted-foreground">
                  This will permanently delete all your assignments, attendance records, exams, and notes.
                  This action cannot be undone.
                </p>
                <p className="text-sm text-muted-foreground">
                  Your theme preference will be preserved.
                </p>
              </div>
            </div>
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="mt-4">
                  Reset All Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete all your:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Assignments</li>
                      <li>Attendance records</li>
                      <li>Exams</li>
                      <li>Notes</li>
                    </ul>
                    <p className="mt-2 font-semibold text-destructive">
                      Your theme preference will be preserved.
                    </p>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsResetDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReset}
                  >
                    Yes, Reset All Data
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>
            Information about UniLife
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <h4 className="font-semibold">UniLife - Student Life Management System</h4>
            <p className="text-sm text-muted-foreground mt-1">
              A comprehensive student management application to help you track assignments, attendance, exams, and notes.
            </p>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold text-sm">Features:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1">
              <li>Assignment tracking with due dates and priorities</li>
              <li>Attendance tracking by subject</li>
              <li>Exam scheduling with countdown timers</li>
              <li>Note-taking with tags and search</li>
              <li>Dashboard with statistics and charts</li>
              <li>Dark mode support</li>
              <li>Local storage for data persistence</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

