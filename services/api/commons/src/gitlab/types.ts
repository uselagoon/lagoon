export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Key {
  id: number;
  title: string;
  key: string;
  created_at: string;
  expires_at: string;
  user: User;
}
