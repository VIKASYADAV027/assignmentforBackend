const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis connection failed:', error);
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  async set(key, value, expirySeconds = 3600) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache set');
        return false;
      }

      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await this.client.setEx(key, expirySeconds, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache get');
        return null;
      }

      const value = await this.client.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache delete');
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async flush() {
    try {
      if (!this.isConnected) {
        console.warn('Redis not connected, skipping cache flush');
        return false;
      }

      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  // Cache wrapper for course data
  async getCachedCourses(cacheKey) {
    return await this.get(`courses:${cacheKey}`);
  }

  async setCachedCourses(cacheKey, courses, expirySeconds = 1800) { // 30 minutes
    return await this.set(`courses:${cacheKey}`, courses, expirySeconds);
  }

  async invalidateCourseCache() {
    try {
      if (!this.isConnected) return false;
      
      const keys = await this.client.keys('courses:*');
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return false;
    }
  }

  // Cache wrapper for recommendations
  async getCachedRecommendations(cacheKey) {
    return await this.get(`recommendations:${cacheKey}`);
  }

  async setCachedRecommendations(cacheKey, recommendations, expirySeconds = 3600) { // 1 hour
    return await this.set(`recommendations:${cacheKey}`, recommendations, expirySeconds);
  }
}

// Create singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
