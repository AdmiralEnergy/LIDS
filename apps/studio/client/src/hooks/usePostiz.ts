/**
 * usePostiz - Hook for Postiz social media scheduling API
 *
 * Postiz runs on Oracle ARM (193.122.153.249:3200)
 * Supports: X, LinkedIn, Instagram, Facebook, TikTok, YouTube, etc.
 */

import { useState, useCallback } from "react";

export interface PostizIntegration {
  id: string;
  name: string;
  type: string;
  picture?: string;
  connected: boolean;
}

export interface PostizPost {
  id: string;
  content: string;
  media?: string[];
  scheduledAt?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  integrationIds: string[];
}

export interface CreatePostRequest {
  content: string;
  integrationIds: string[];
  type: "now" | "schedule";
  date?: string;
  media?: string[];
}

export interface VideoGenerateRequest {
  script: string;
  style?: string;
  duration?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export function usePostiz() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if Postiz is healthy and connected
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/postiz/health");
      return response.json();
    } catch (err) {
      return { status: "offline", error: "Connection failed" };
    }
  }, []);

  /**
   * Get connected social media integrations
   */
  const getIntegrations = useCallback(async (): Promise<PostizIntegration[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/postiz/integrations");

      if (!response.ok) {
        throw new Error(`Failed to fetch integrations: ${response.status}`);
      }

      const data = await response.json();
      return data.integrations || data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch integrations";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get scheduled posts
   */
  const getPosts = useCallback(async (): Promise<PostizPost[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/postiz/posts");

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      return data.posts || data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch posts";
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create and schedule a post
   */
  const createPost = useCallback(async (post: CreatePostRequest): Promise<PostizPost | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/postiz/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create post: ${response.status}`);
      }

      return response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create post";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a scheduled post
   */
  const deletePost = useCallback(async (postId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/postiz/posts/${postId}`, {
        method: "DELETE",
      });

      return response.ok;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete post";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Find next available slot for a channel
   */
  const findSlot = useCallback(async (channelId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/postiz/find-slot/${channelId}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.slot || data.time || null;
    } catch (err) {
      return null;
    }
  }, []);

  /**
   * Upload media from URL
   */
  const uploadFromUrl = useCallback(async (url: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/postiz/upload-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload: ${response.status}`);
      }

      const data = await response.json();
      return data.url || data.path || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Generate video using Postiz's built-in video generation
   */
  const generateVideo = useCallback(async (request: VideoGenerateRequest): Promise<{ videoUrl: string } | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/postiz/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate video: ${response.status}`);
      }

      return response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate video";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Schedule a video post to multiple platforms
   */
  const scheduleVideoPost = useCallback(async (
    videoUrl: string,
    content: string,
    integrationIds: string[],
    scheduledAt?: string
  ): Promise<PostizPost | null> => {
    // First upload the video to Postiz
    const uploadedUrl = await uploadFromUrl(videoUrl);

    if (!uploadedUrl) {
      return null;
    }

    // Then create the post with the video
    return createPost({
      content,
      integrationIds,
      type: scheduledAt ? "schedule" : "now",
      date: scheduledAt,
      media: [uploadedUrl],
    });
  }, [uploadFromUrl, createPost]);

  return {
    isLoading,
    error,
    checkHealth,
    getIntegrations,
    getPosts,
    createPost,
    deletePost,
    findSlot,
    uploadFromUrl,
    generateVideo,
    scheduleVideoPost,
  };
}
