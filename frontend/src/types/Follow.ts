export interface Follow {
  _id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowStatus {
  isFollowing: boolean;
}