export interface Follow {
    id: number;
    followerId: number; // ID di chi segue
    followedId: number; // ID di chi viene seguito
    createdAt: Date;
}