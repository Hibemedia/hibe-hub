export interface MockVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  status: 'waiting' | 'approved' | 'rejected';
  platform: string;
  uploadDate: string;
  client?: string;
}

export const mockVideos: MockVideo[] = [
  {
    id: '1',
    title: 'VIP Fashion Summer Collection Launch',
    thumbnail: '/src/assets/video-approval-1.jpg',
    duration: '2:15',
    status: 'waiting',
    platform: 'Instagram',
    uploadDate: '2024-01-15',
    client: 'VIP Fashion'
  },
  {
    id: '2', 
    title: 'Behind the Scenes: New Studio Setup',
    thumbnail: '/src/assets/video-approval-2.jpg',
    duration: '1:45',
    status: 'approved',
    platform: 'TikTok',
    uploadDate: '2024-01-14',
    client: 'VIP Fashion'
  },
  {
    id: '3',
    title: 'Product Showcase: Designer Handbags',
    thumbnail: '/src/assets/video-approval-3.jpg',
    duration: '0:58',
    status: 'waiting',
    platform: 'YouTube',
    uploadDate: '2024-01-13',
    client: 'VIP Fashion'
  }
];

export function getMockVideos(clientId?: string): MockVideo[] {
  if (clientId) {
    return mockVideos.filter(video => video.client === clientId);
  }
  return mockVideos;
}