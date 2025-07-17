export interface MockPost {
  id: string;
  title: string;
  platform: string;
  engagement: number;
  views: number;
  likes: number;
  shares: number;
  publishedAt: string;
  thumbnail?: string;
  client?: string;
}

export const mockPosts: MockPost[] = [
  {
    id: '1',
    title: 'Winter Collection Reveal',
    platform: 'Instagram',
    engagement: 15.2,
    views: 45000,
    likes: 6850,
    shares: 320,
    publishedAt: '2024-01-10',
    thumbnail: '/src/assets/video-thumb-1.jpg',
    client: 'VIP Fashion'
  },
  {
    id: '2',
    title: 'Style Tips: Layering for Winter',
    platform: 'TikTok', 
    engagement: 12.8,
    views: 38000,
    likes: 4865,
    shares: 245,
    publishedAt: '2024-01-08',
    thumbnail: '/src/assets/video-thumb-2.jpg',
    client: 'VIP Fashion'
  },
  {
    id: '3',
    title: 'Designer Interview: Autumn Trends',
    platform: 'YouTube',
    engagement: 9.5,
    views: 25000,
    likes: 2375,
    shares: 180,
    publishedAt: '2024-01-05',
    thumbnail: '/src/assets/video-thumb-3.jpg',
    client: 'VIP Fashion'
  }
];

export function getMockPosts(clientId?: string): MockPost[] {
  if (clientId) {
    return mockPosts.filter(post => post.client === clientId);
  }
  return mockPosts;
}