const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  }

  private setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  private clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          throw new Error('Authentication required');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await this.request<{
      message: string;
      admin: {
        id: string;
        username: string;
        email: string;
        role: string;
        lastLogin: string;
      };
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setToken(response.token);
    return response;
  }

  async signup(username: string, email: string, password: string) {
    const response = await this.request<{
      message: string;
      admin: {
        id: string;
        username: string;
        email: string;
        role: string;
      };
      token: string;
    }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    this.setToken(response.token);
    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  }

  async getProfile() {
    return await this.request<{
      admin: {
        id: string;
        username: string;
        email: string;
        role: string;
        lastLogin: string;
        createdAt: string;
      };
    }>('/auth/me');
  }

  // Course endpoints
  async getCourses(params?: {
    query?: string;
    universityCode?: string;
    courseLevel?: string;
    disciplineMajor?: string;
    attendanceType?: string;
    minTuition?: number;
    maxTuition?: number;
    limit?: number;
    page?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/courses?${queryString}` : '/courses';
    
    return await this.request<{
      courses: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
      fromCache: boolean;
    }>(endpoint);
  }

  async getCourse(id: string) {
    return await this.request<{ course: any }>(`/courses/${id}`);
  }

  async getCourseStats() {
    return await this.request<{
      summary: any;
      byLevel: any[];
      byAttendance: any[];
      topUniversities: any[];
      fromCache: boolean;
    }>('/courses/stats/summary');
  }

  async uploadCourses(file: File) {
    const formData = new FormData();
    formData.append('csvFile', file);

    return await this.request<{
      message: string;
      summary: {
        totalProcessed: number;
        successful: number;
        errors: number;
      };
      errors: any[];
    }>('/courses/upload', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData
      },
      body: formData,
    });
  }

  // Recommendation endpoints
  async getRecommendations(preferences: {
    topics: string[];
    skillLevel?: string;
    duration?: string;
    maxTuition?: number;
  }) {
    return await this.request<{
      aiRecommendations: any[];
      databaseCourses: any[];
      reasoning: string;
      preferences: any;
      fromCache: boolean;
    }>('/recommendations', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }

  async getPopularRecommendations() {
    return await this.request<{
      popularCourses: any[];
      reasoning: string;
      fromCache: boolean;
    }>('/recommendations/popular');
  }

  async getAvailableTopics() {
    return await this.request<{
      topics: string[];
      fromCache: boolean;
    }>('/recommendations/topics');
  }

  // Health check
  async healthCheck() {
    return await this.request<{
      status: string;
      message: string;
      timestamp: string;
    }>('/health');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export types for better TypeScript support
export interface Course {
  uniqueId: string;
  courseName: string;
  courseCode: string;
  universityCode: string;
  universityName: string;
  departmentSchool: string;
  disciplineMajor: string;
  specialization?: string;
  courseLevel: 'Undergraduate' | 'Postgraduate' | 'Doctorate' | 'Diploma' | 'Certificate';
  overviewDescription: string;
  summary: string;
  prerequisites: string[];
  learningOutcomes: string[];
  teachingMethodology: string;
  assessmentMethods: string[];
  credits: number;
  durationMonths: number;
  languageOfInstruction: string;
  syllabusUrl?: string;
  keywords: string[];
  professorName?: string;
  professorEmail?: string;
  officeLocation?: string;
  openForIntake?: string;
  admissionOpenYears: string;
  attendanceType: 'Full-time' | 'Part-time' | 'Online';
  firstYearTuitionFee: number;
  totalTuitionFee: number;
  tuitionFeeCurrency: string;
  applicationFeeAmount: number;
  applicationFeeCurrency: string;
  applicationFeeWaived: boolean;
  requiredApplicationMaterials: string;
  twelfthGradeRequirement?: string;
  undergraduateDegreeRequirement?: string;
  minimumIELTSScore?: number;
  minimumTOEFLScore?: number;
  minimumPTEScore?: number;
  minimumDuolingoScore?: number;
  minimumCambridgeEnglishScore?: string;
  otherEnglishTestsAccepted?: string;
  greRequired: boolean;
  greScore?: string;
  gmatRequired: boolean;
  gmatScore?: string;
  satRequired: boolean;
  satScore?: string;
  actRequired: boolean;
  actScore?: string;
  waiverOptions?: string;
  partnerCourse: boolean;
  ftRanking2024?: number;
  acceptanceRate?: number;
  domesticApplicationDeadline: string;
  internationalApplicationDeadline: string;
  courseUrl: string;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  admin: Admin;
  token: string;
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  fromCache: boolean;
}

export interface RecommendationsResponse {
  aiRecommendations: any[];
  databaseCourses: Course[];
  reasoning: string;
  preferences: any;
  fromCache: boolean;
}
