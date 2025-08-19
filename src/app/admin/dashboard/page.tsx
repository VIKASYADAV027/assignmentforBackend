'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Users, 
  BookOpen, 
  TrendingUp, 
  LogOut, 
  FileText,
  Database,
  Cpu,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  summary: {
    totalCourses: number;
    avgTuition: number;
    minTuition: number;
    maxTuition: number;
  };
  byLevel: Array<{ _id: string; count: number }>;
  byAttendance: Array<{ _id: string; count: number }>;
  topUniversities: Array<{ _id: string; universityName: string; count: number }>;
}

export default function AdminDashboard() {
  const { admin, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/admin/login');
      return;
    }

    loadDashboardStats();
  }, [isAuthenticated, router]);

  const loadDashboardStats = async () => {
    try {
      const response = await apiClient.getCourseStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const response = await apiClient.uploadCourses(uploadFile);
      setUploadMessage({
        type: 'success',
        message: `Upload completed! ${response.summary.successful} courses processed successfully.`
      });
      setUploadFile(null);
      // Reload stats after upload
      await loadDashboardStats();
    } catch (error) {
      setUploadMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {admin?.username} ({admin?.email})
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                Role: {admin?.role}
              </Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.summary.totalCourses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Courses in database
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Tuition</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.summary.avgTuition?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                USD per year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Min Tuition</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.summary.minTuition?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Lowest tuition fee
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Max Tuition</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.summary.maxTuition?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Highest tuition fee
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Course Data
              </CardTitle>
              <CardDescription>
                Upload a CSV file to add or update course information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadMessage && (
                <Alert className={`mb-4 ${uploadMessage.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                  <AlertDescription>{uploadMessage.message}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleFileUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csvFile">CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a CSV file with course data. Maximum file size: 10MB
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={!uploadFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Courses
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/course-match">
                <Button variant="outline" className="w-full justify-start">
                  <Cpu className="h-4 w-4 mr-2" />
                  AI Course Recommendations
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Course Catalog
                </Button>
              </Link>

              <Button variant="outline" className="w-full justify-start" onClick={loadDashboardStats}>
                <Database className="h-4 w-4 mr-2" />
                Refresh Statistics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Course Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* By Level */}
          <Card>
            <CardHeader>
              <CardTitle>Courses by Level</CardTitle>
              <CardDescription>Distribution of courses by academic level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.byLevel.map((level) => (
                  <div key={level._id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{level._id}</span>
                      <span className="font-medium">{level.count}</span>
                    </div>
                    <Progress 
                      value={(level.count / (stats?.summary.totalCourses || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* By Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Courses by Attendance Type</CardTitle>
              <CardDescription>Distribution of courses by attendance mode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.byAttendance.map((attendance) => (
                  <div key={attendance._id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{attendance._id}</span>
                      <span className="font-medium">{attendance.count}</span>
                    </div>
                    <Progress 
                      value={(attendance.count / (stats?.summary.totalCourses || 1)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Universities */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Top Universities by Course Count</CardTitle>
            <CardDescription>Universities with the most courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topUniversities.map((uni, index) => (
                <div key={uni._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">{uni.universityName}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {uni.count} courses
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
